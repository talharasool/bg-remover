import gradio as gr
from rembg import remove, new_session
from PIL import Image
import io

# Load BiRefNet model once at startup
print("Loading BiRefNet model...")
session = new_session("birefnet-general")
print("Model loaded!")

def remove_background(input_image):
    """Remove background from image using BiRefNet."""
    if input_image is None:
        return None

    # Convert to bytes
    img_byte_arr = io.BytesIO()
    input_image.save(img_byte_arr, format='PNG')
    img_bytes = img_byte_arr.getvalue()

    # Remove background
    output_bytes = remove(img_bytes, session=session)

    # Convert back to PIL Image
    output_image = Image.open(io.BytesIO(output_bytes))
    return output_image

# Create Gradio interface
demo = gr.Interface(
    fn=remove_background,
    inputs=gr.Image(type="pil", label="Upload Image"),
    outputs=gr.Image(type="pil", label="Result (Transparent Background)"),
    title="Background Remover",
    description="Remove backgrounds from images using BiRefNet AI model. Upload an image and get a transparent PNG.",
    examples=[],
    cache_examples=False,
    allow_flagging="never",
)

if __name__ == "__main__":
    demo.launch(max_file_size="20mb")
