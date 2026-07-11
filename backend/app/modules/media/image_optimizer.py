from io import BytesIO

from PIL import Image, ImageOps


OUTPUT_MIME_TYPE = "image/jpeg"
OUTPUT_EXTENSION = ".jpg"


def optimize_animal_photo(
    input_image_bytes: bytes,
    max_dimension: int = 2048,
    quality: int = 82,
) -> tuple[bytes, int, str, str]:
    if max_dimension <= 0:
        raise ValueError("max_dimension must be positive")
    if not 1 <= quality <= 95:
        raise ValueError("quality must be between 1 and 95")

    with Image.open(BytesIO(input_image_bytes)) as source_image:
        source_image.load()
        normalized_image = ImageOps.exif_transpose(source_image)
        normalized_image.thumbnail(
            (max_dimension, max_dimension),
            Image.Resampling.LANCZOS,
        )
        output_image = (
            normalized_image
            if normalized_image.mode == "RGB"
            else normalized_image.convert("RGB")
        )
        try:
            output_buffer = BytesIO()
            output_image.save(
                output_buffer,
                format="JPEG",
                quality=quality,
                optimize=True,
            )
            optimized_bytes = output_buffer.getvalue()
        finally:
            if output_image is not normalized_image:
                output_image.close()
            if normalized_image is not source_image:
                normalized_image.close()

    return (
        optimized_bytes,
        len(optimized_bytes),
        OUTPUT_MIME_TYPE,
        OUTPUT_EXTENSION,
    )
