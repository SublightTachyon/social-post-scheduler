import json
import os
from pathlib import Path
import secrets

def sync_images_from_folder(images_dir, images_json_path, base_url="http://localhost:3000/images"):
    """Scan images folder and add new images to images.json"""
    try:
        # Read existing images.json
        images = []
        if os.path.exists(images_json_path):
            try:
                with open(images_json_path, "r") as f:
                    images = json.load(f)
            except (json.JSONDecodeError, IOError):
                pass

        # Get existing image IDs
        existing_ids = {img["id"] for img in images}

        # Create images folder if it doesn't exist
        if not os.path.exists(images_dir):
            print("Images folder does not exist yet. Create data/images/ and add images.")
            return images

        # Filter for image files
        image_extensions = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
        image_files = [
            f for f in os.listdir(images_dir)
            if os.path.isfile(os.path.join(images_dir, f)) and
            Path(f).suffix.lower() in image_extensions
        ]

        # Add new images
        added = 0
        for filename in sorted(image_files):
            id_from_file = Path(filename).stem
            unique_id = id_from_file

            # Handle collisions
            if unique_id in existing_ids:
                unique_id = f"{id_from_file}-{secrets.token_hex(4)}"

            if unique_id not in existing_ids:
                images.append({
                    "id": unique_id,
                    "url": f"{base_url}/{filename}",
                    "caption": f"Image: {filename}"
                })
                existing_ids.add(unique_id)
                added += 1

        # Write back to images.json if new images were added
        if added > 0:
            with open(images_json_path, "w") as f:
                json.dump(images, f, indent=2)
                f.write("\n")
            print(f"Added {added} new image(s) to images.json")

        return images

    except Exception as e:
        print(f"Error syncing images: {e}")
        raise
