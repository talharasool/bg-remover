"""Watermark detection and removal service using OpenCV + LaMa inpainting."""

import cv2
import numpy as np


class WatermarkRemover:
    """Detects watermark regions via OpenCV heuristics, then inpaints with LaMa."""

    def __init__(self) -> None:
        self._model = None

    def _get_model(self):
        """Lazy-load the LaMa inpainting model."""
        if self._model is None:
            from iopaint.model_manager import ModelManager

            self._model = ModelManager(name="lama", device="cpu")
        return self._model

    def detect_watermark_mask(self, image_bgr: np.ndarray) -> np.ndarray:
        """Detect watermark regions using OpenCV heuristics.

        Returns a binary mask (255 = watermark, 0 = clean).
        """
        h, w = image_bgr.shape[:2]
        gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
        hsv = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2HSV)

        # Multi-scale Canny edge detection
        edges_fine = cv2.Canny(gray, 50, 150)
        edges_coarse = cv2.Canny(gray, 30, 100)
        edges = cv2.bitwise_or(edges_fine, edges_coarse)

        # Color filter: low saturation + high brightness (typical semi-transparent watermarks)
        saturation = hsv[:, :, 1]
        value = hsv[:, :, 2]
        color_candidates = np.zeros((h, w), dtype=np.uint8)
        color_candidates[(saturation < 40) & (value > 150)] = 255

        # Combine edges AND color candidates
        combined = cv2.bitwise_and(edges, color_candidates)

        # Morphological close to fill gaps, open to remove noise
        kernel_close = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15))
        kernel_open = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        mask = cv2.morphologyEx(combined, cv2.MORPH_CLOSE, kernel_close)
        mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel_open)

        # Connected component filter: keep components between 0.05% and 30% of image area
        total_area = h * w
        min_area = int(total_area * 0.0005)
        max_area = int(total_area * 0.30)

        num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(mask, connectivity=8)
        filtered = np.zeros((h, w), dtype=np.uint8)
        for i in range(1, num_labels):
            area = stats[i, cv2.CC_STAT_AREA]
            if min_area <= area <= max_area:
                filtered[labels == i] = 255

        # Final dilation for edge coverage
        kernel_dilate = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
        filtered = cv2.dilate(filtered, kernel_dilate, iterations=2)

        return filtered

    def remove_watermark(self, image_bytes: bytes) -> bytes:
        """Full pipeline: detect watermark and inpaint with LaMa.

        Returns cleaned PNG image bytes.
        Raises ValueError if no watermark is detected.
        """
        # Decode image
        nparr = np.frombuffer(image_bytes, np.uint8)
        image_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if image_bgr is None:
            raise ValueError("Failed to decode image")

        # Detect watermark mask
        mask = self.detect_watermark_mask(image_bgr)

        if cv2.countNonZero(mask) == 0:
            raise ValueError("No watermark detected")

        # Convert BGR to RGB for LaMa
        image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)

        # Run LaMa inpainting
        model = self._get_model()
        result = model(image_rgb, mask)

        # Convert result back to BGR for encoding
        result_bgr = cv2.cvtColor(result, cv2.COLOR_RGB2BGR)

        # Encode as PNG
        success, encoded = cv2.imencode(".png", result_bgr)
        if not success:
            raise ValueError("Failed to encode result image")

        return encoded.tobytes()
