#!/bin/bash

# Function to delete a directory if it exists
function delete_directory {
    echo "----------------"
    echo "Removing '$1'..."

    if [ -d "$1" ]; then
        rm -rf "$1"
        echo "Successfully removed '$1'"
    else
        echo "'$1' not found. Skipping..."
    fi
}

echo "🚀 Starting fix process..."
echo ""

delete_directory "dist"
delete_directory "tmp"
delete_directory ".nx"

echo "----------------"
echo "Searching for node_modules/ folders..."
find . -name "node_modules" -type d -exec rm -rf {} +
echo "Deleted all node_modules/ folders."
echo "----------------"


echo ""
echo "🎉 Dependency reset completed."
