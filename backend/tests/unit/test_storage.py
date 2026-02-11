from pathlib import Path

# ---------------------------------------------------------------------------
# LocalStorage — save / read / delete
# ---------------------------------------------------------------------------


class TestLocalStorageSaveOriginal:
    async def test_save_original(self, local_storage, small_jpeg: bytes):
        path = await local_storage.save_original(small_jpeg, "photo.jpg", "job-1")
        assert Path(path).exists()
        assert Path(path).name == "photo.jpg"
        assert "job-1" in path

    async def test_save_creates_job_directory(self, local_storage, small_jpeg: bytes):
        path = await local_storage.save_original(small_jpeg, "photo.jpg", "job-new")
        job_dir = Path(path).parent
        assert job_dir.name == "job-new"
        assert job_dir.is_dir()


class TestLocalStorageSaveProcessed:
    async def test_save_processed_as_png(self, local_storage, small_png: bytes):
        path = await local_storage.save_processed(small_png, "photo.jpg", "job-1")
        assert Path(path).exists()
        assert Path(path).suffix == ".png"
        assert Path(path).stem == "photo"

    async def test_save_processed_preserves_content(self, local_storage, small_png: bytes):
        path = await local_storage.save_processed(small_png, "img.jpg", "job-1")
        content = Path(path).read_bytes()
        assert content == small_png


class TestLocalStorageGetFile:
    async def test_get_existing_file(self, local_storage, small_jpeg: bytes):
        path = await local_storage.save_original(small_jpeg, "photo.jpg", "job-1")
        content = await local_storage.get_file(path)
        assert content == small_jpeg

    async def test_get_nonexistent_file(self, local_storage):
        content = await local_storage.get_file("/does/not/exist.jpg")
        assert content is None


class TestLocalStorageDeleteFile:
    async def test_delete_existing_file(self, local_storage, small_jpeg: bytes):
        path = await local_storage.save_original(small_jpeg, "photo.jpg", "job-1")
        assert await local_storage.delete_file(path) is True
        assert not Path(path).exists()

    async def test_delete_nonexistent_file(self, local_storage):
        assert await local_storage.delete_file("/does/not/exist.jpg") is False


class TestLocalStorageListFiles:
    async def test_list_files(self, local_storage, small_jpeg: bytes):
        await local_storage.save_original(small_jpeg, "a.jpg", "job-1")
        await local_storage.save_original(small_jpeg, "b.jpg", "job-1")
        files = await local_storage.list_files()
        assert len(files) == 2

    async def test_list_files_empty(self, local_storage):
        files = await local_storage.list_files()
        assert files == []


class TestLocalStorageGetFilePath:
    async def test_get_file_path_exists(self, local_storage, small_jpeg: bytes):
        path = await local_storage.save_original(small_jpeg, "photo.jpg", "job-1")
        result = await local_storage.get_file_path(path)
        assert result is not None
        assert result.exists()

    async def test_get_file_path_missing(self, local_storage):
        result = await local_storage.get_file_path("/nope.jpg")
        assert result is None
