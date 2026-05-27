import io
import os
import tempfile
from flask import Flask, request, jsonify, send_file
from parser.trux_parser import parse_pdf, parse_result_to_dict
from generator.report_generator import generate_report_pdf

app = Flask(__name__)


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


@app.route("/parse", methods=["POST"])
def parse():
    """
    Accepts a multipart PDF upload.
    Returns extracted ticket data as JSON.
    """
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]
    if not file.filename.lower().endswith(".pdf"):
        return jsonify({"error": "File must be a PDF"}), 400

    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        file.save(tmp.name)
        tmp_path = tmp.name

    try:
        result = parse_pdf(tmp_path)
        return jsonify(parse_result_to_dict(result))
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        os.unlink(tmp_path)


@app.route("/generate", methods=["POST"])
def generate():
    """
    Accepts JSON report data.
    Returns a PDF binary as application/pdf.
    """
    data = request.get_json()
    if not data:
        return jsonify({"error": "No JSON body provided"}), 400

    try:
        pdf_bytes = generate_report_pdf(data)
        return send_file(
            io.BytesIO(pdf_bytes),
            mimetype="application/pdf",
            as_attachment=False,
            download_name="report.pdf",
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
