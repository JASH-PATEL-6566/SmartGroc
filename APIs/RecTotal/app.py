from flask import Flask, request, jsonify
import re
import cv2
import pytesseract

app = Flask(__name__)

# Function to extract total amount using regex and keyword filtering
def extract_total_amount(text):
    """
    Extracts the total amount from the receipt text using regex and keyword filtering.
    """
    # Normalize the text (remove extra spaces and make it lowercase)
    text = text.replace(" ", "")  # Remove spaces
    text = text.lower()  # Convert to lowercase

    # Regular expression to find monetary values (e.g., "$12.34", "12.34", "16.80")
    amount_pattern = r'\$?\d+\.\d{2}'

    # Split text into lines for easier processing
    lines = text.split("\n")
    total_amount = None

    for line in lines:
        amounts = re.findall(amount_pattern, line)  # Find all monetary values
        if "total" in line:  # Check if the line contains the word "total"
            if amounts:
                total_amount = amounts[-1]  # Get the last amount in the line

    return total_amount

@app.route('/extract_receipt_data', methods=['POST'])
def extract_receipt_data():
    """
    API endpoint to extract total amount from a receipt image.
    """
    # Check if an image was uploaded
    if 'file' not in request.files:
        return jsonify({"error": "No file provided!"}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({"error": "No selected file!"}), 400
    
    # Save the file temporarily
    image_path = '/tmp/receipt_image.jpeg'
    file.save(image_path)

    # Load the image
    image = cv2.imread(image_path)

    # Check if the image is loaded correctly
    if image is None:
        return jsonify({"error": "Unable to read the image file!"}), 400

    # Convert to grayscale for better OCR accuracy
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # Apply thresholding
    thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]

    # Extract text using Tesseract OCR
    text = pytesseract.image_to_string(thresh)

    # Get the total amount
    total_amount = extract_total_amount(text)

    # Return the result in JSON format
    return jsonify({
        "total_amount": total_amount if total_amount else "Not Found"
    })

if __name__ == '__main__':
    app.run(debug=True)
