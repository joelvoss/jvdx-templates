#!/usr/bin/env uv run
"""Update direct dependency declarations and regenerate the uv lock file."""

import re
import subprocess
import sys
from pathlib import Path


def run_uv_outdated(project_dir: Path) -> str:
    """Run uv tree --outdated -d1 and return the output."""
    try:
        result = subprocess.run(
            ["uv", "tree", "--outdated", "-d1"],
            cwd=project_dir,
            capture_output=True,
            text=True,
            check=True,
        )
        return result.stdout
    except subprocess.CalledProcessError as e:
        print(f"Error running 'uv tree --outdated -d1': {e}")
        sys.exit(1)
    except FileNotFoundError:
        print("Error: uv command not found. Please install uv first.")
        sys.exit(1)


def parse_outdated_output(output: str) -> dict[str, tuple[str, bool]]:
    """
    Parse the 'uv tree --outdated -d1' output to extract package names and
    latest versions.
    Returns a dictionary mapping package names to (latest_version,
    is_dev_dependency).
    """
    outdated_packages = {}

    # Pattern to match lines like:
    # ├── fastapi[standard] v0.115.12 (latest: v0.115.14)
    # ├── mypy v1.16.0 (group: dev) (latest: v1.16.1)
    pattern = r"[├└]── (.+?)\s+v\d+\.\d+\.\d+(?:\.\d+)?\s+(?:\(group: dev\)\s+)?\(latest: v(\d+\.\d+\.\d+(?:\.\d+)?)\)"

    for line in output.split("\n"):
        match = re.search(pattern, line)
        if match:
            package_name = match.group(1)
            latest_version = match.group(2)
            is_dev = "(group: dev)" in line

            # Handle package names with extras like "fastapi[standard]"
            base_package = package_name.split("[")[0]
            outdated_packages[base_package] = (latest_version, is_dev)

    return outdated_packages


def read_pyproject_toml(file_path: Path) -> str:
    """Read the pyproject.toml file and return its content."""
    try:
        with open(file_path, encoding="utf-8") as f:
            return f.read()
    except FileNotFoundError:
        print(f"Error: {file_path} not found.")
        sys.exit(1)


def update_dependencies_in_content(
    content: str, outdated_packages: dict[str, tuple[str, bool]]
) -> tuple[str, list[str]]:
    """
    Update dependency versions in the pyproject.toml content.
    Returns updated content and a list of updated packages.
    """
    updated_content = content
    updated_packages = []

    for package_name, (latest_version, _is_dev) in outdated_packages.items():
        # Pattern to match dependency lines like:
        # "fastapi[standard]>=0.115.12",
        # "mypy>=1.16.0",

        # First, try to match package with extras
        pattern_with_extras = rf'(\s+")({re.escape(package_name)}\[[^\]]+\])([><=!~]+)(\d+\.\d+\.\d+(?:\.\d+)?)(.*?)(")'
        match = re.search(pattern_with_extras, updated_content)

        if match:
            old_line = match.group(0)
            new_line = f"{match.group(1)}{match.group(2)}{match.group(3)}{latest_version}{match.group(5)}{match.group(6)}"
            updated_content = updated_content.replace(old_line, new_line)
            updated_packages.append(
                f"{match.group(2)}: {match.group(4)} → {latest_version}"
            )
        else:
            # Try to match package without extras
            pattern_simple = rf'(\s+")({re.escape(package_name)})([><=!~]+)(\d+\.\d+\.\d+(?:\.\d+)?)(.*?)(")'
            match = re.search(pattern_simple, updated_content)

            if match:
                old_line = match.group(0)
                new_line = f"{match.group(1)}{match.group(2)}{match.group(3)}{latest_version}{match.group(5)}{match.group(6)}"
                updated_content = updated_content.replace(old_line, new_line)
                updated_packages.append(
                    f"{match.group(2)}: {match.group(4)} → {latest_version}"
                )

    return updated_content, updated_packages


def write_pyproject_toml(file_path: Path, content: str) -> None:
    """Write the updated content back to pyproject.toml."""
    try:
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)
    except Exception as e:
        print(f"Error writing to {file_path}: {e}")
        sys.exit(1)


def main() -> None:
    """Main function to orchestrate the dependency update process."""
    print("🔍 Checking for outdated dependencies...")

    # Get the current directory and pyproject.toml path
    current_dir = Path(__file__).resolve().parents[1]
    pyproject_path = current_dir / "pyproject.toml"

    # Run uv tree --outdated to get the list of outdated packages
    outdated_output = run_uv_outdated(current_dir)

    # Parse the output to extract package names and latest versions
    outdated_packages = parse_outdated_output(outdated_output)

    if not outdated_packages:
        print("✅ No outdated dependencies found!")
        return

    print(f"📦 Found {len(outdated_packages)} outdated dependencies:")
    for package, (version, is_dev) in outdated_packages.items():
        group = " (dev)" if is_dev else ""
        print(f"  • {package} → {version}{group}")

    # Read the current pyproject.toml content
    current_content = read_pyproject_toml(pyproject_path)

    # Update the dependencies in the content
    updated_content, updated_packages = update_dependencies_in_content(
        current_content, outdated_packages
    )

    if not updated_packages:
        print("⚠️  No dependencies were updated in pyproject.toml")
        return

    # Write the updated content back to pyproject.toml
    write_pyproject_toml(pyproject_path, updated_content)

    print(f"\n✅ Successfully updated {len(updated_packages)} dependencies:")
    for update in updated_packages:
        print(f"  • {update}")

    print("\n📝 Updated pyproject.toml saved!")

    print("Recreating lock file...")
    try:
        subprocess.run(
            ["uv", "lock", "--project", str(current_dir)],
            capture_output=True,
            text=True,
            check=True,
        )
        print("Lock file recreated successfully!")
    except subprocess.CalledProcessError as e:
        print(f"❌ Error recreating lock file: {e}")
        print(f"Output: {e.stdout}")
        print(f"Error: {e.stderr}")
        sys.exit(1)


if __name__ == "__main__":
    main()
