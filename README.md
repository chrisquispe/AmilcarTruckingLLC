# Amilcar Trucking LLC — Payment Automation Platform

## Why I Built This

My dad works in the trucking logistics business, and every week he had to go through TRUX remittance PDFs by hand — adding up ticket amounts, figuring out driver pay, and writing it all out manually. It was a lot of repetitive paperwork. I wanted to make that easier for him, so I built this program that lets me do all of it quickly on my computer instead.

---

A full-stack web application that automates driver pay calculations for Amilcar Trucking LLC. Instead of manually adding up numbers from TRUX remittance PDFs, you upload the PDF and the app extracts every ticket, organizes it by truck, calculates driver pay, and generates a clean downloadable report.

---

## What It Does

1. **Upload a TRUX remittance PDF** — the app automatically reads every ticket from the PDF
2. **Review the extracted data** — tickets are shown in a table organized by truck, separated into regular tickets and fuel/reimbursement rows
3. **Assign a driver to each truck** — pick from saved drivers or type a new name
4. **Set the driver pay percentage** — defaults to 33%, adjustable per truck
5. **Preview the report** — see exactly what the PDF will look like before downloading
6. **Download the PDF** — a clean, professional one-page report per truck

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, Tailwind CSS |
| Backend | Spring Boot 3.5, Java 17 |
| Database | MySQL |
| PDF Parser | Python (Flask, pdfplumber) |
| PDF Generator | Python (reportlab) |

The app runs as three separate services that talk to each other:

```
Browser (React) → Spring Boot API → MySQL
                                 → Python Service (parse & generate PDFs)
```

---

## Project Structure

```
AmilcarTruckingLLC/
│
├── frontend/          React app (runs on port 5173)
│   └── src/
│       ├── pages/         Dashboard, Upload, Reports, Drivers, Trucks
│       ├── components/    Sidebar, tables, forms, preview
│       └── api/           All API calls to the backend
│
├── backend/           Spring Boot REST API (runs on port 8080)
│   └── src/main/java/com/amilcartrucking/backend/
│       ├── controller/    HTTP endpoints
│       ├── service/       Business logic
│       ├── model/         Database tables (JPA entities)
│       ├── repository/    Database queries
│       └── dto/           Data shapes sent between layers
│
└── python-service/    PDF parser and generator (runs on port 5001)
    ├── app.py             Flask server with /parse and /generate endpoints
    ├── parser/            Reads TRUX PDF and extracts ticket data
    └── generator/         Builds the driver pay PDF report
```

---

## Database Tables

| Table | What it stores |
|-------|---------------|
| `drivers` | Driver names, which ones are "pinned" as common |
| `trucks` | Truck numbers (e.g. TRUX35367) seen across all uploads |
| `uploaded_reports` | Every PDF that has been uploaded |
| `extracted_tickets` | Every individual ticket line from every uploaded PDF |
| `report_totals` | Per-truck totals, driver assignment, percentage, and driver pay |

---

## How to Run

You need three terminals open at the same time.

### Prerequisites
- Java 17
- Node.js
- Python 3.11+
- MySQL running locally

### 1. Set up the database

Make sure MySQL is running. The app will create the `amilcar_trucking` database automatically on first start.

Update the password in `backend/src/main/resources/application.properties`:
```
spring.datasource.password=YOUR_MYSQL_PASSWORD
```

### 2. Start the Python service (Terminal 1)

```bash
cd python-service
pip install -r requirements.txt
python app.py
```

You should see: `Running on http://0.0.0.0:5001`

### 3. Start the Spring Boot backend (Terminal 2)

```bash
cd backend
./mvnw spring-boot:run
```

You should see: `Started BackendApplication` after a few seconds.

### 4. Start the React frontend (Terminal 3)

```bash
cd frontend
npm install
npm run dev
```

Open your browser to **http://localhost:5173**

---

## Pages

### Dashboard
Shows a summary of all uploaded reports, total revenue across all reports, number of active trucks, and number of saved drivers. Click any report row to open it.

### Upload PDF
Drag and drop a TRUX remittance PDF (or click to browse). The app sends it to the Python parser, extracts all tickets organized by truck, and takes you to the report detail page automatically.

### Reports
A searchable list of all uploaded PDFs with their status, week, and truck count. Click any row to open it. You can also delete reports from here.

### Report Detail — Tab 1: Extracted Data
Shows all tickets for the selected truck in a table. You can:
- Click any cell to edit it inline
- Move a ticket between the main table and the fuel/reimbursement table using the arrow button
- Delete a ticket row
- Manually add a new ticket row at the bottom of either table

### Report Detail — Tab 2: Assign Drivers
One card per truck. For each truck you can:
- Type a driver name (saved common drivers appear as suggestions)
- Set the pay percentage with a slider (default 33%)
- Toggle whether fuel/reimbursement rows are included in the driver pay calculation
- Click "Save & Calculate" to save and see the calculated driver pay

### Report Detail — Tab 3: Preview & Generate
Shows a live preview of exactly what the PDF will look like. You can:
- Pick the report date (defaults to today)
- Select which truck to preview
- Click "Generate PDF" to create the PDF file
- Click "Download PDF" to save it

### Drivers
Manage saved driver names. Pin (★) common drivers so they appear first in dropdowns. Add, edit, or delete drivers at any time.

### Trucks
All trucks seen across every uploaded PDF. Click a truck to expand its full report history — showing which driver was assigned, what the main total was, and what the driver pay was for each week.

---

## PDF Parsing — How It Works

The Python parser reads the TRUX remittance PDF using `pdfplumber`. It detects each truck section (e.g. `TRUX35367 : Amilcar Trucking`) and reads every ticket row under it. For each row it extracts:

- Ticket date
- Ticket number
- Quantity (tons)
- Pay rate (dollars per ton)
- Pay amount (total dollars)

Fuel surcharge rows are automatically detected by looking for the words "Fuel Surcharge" or "FSC Pay Only" in the row, and are stored separately from regular tickets.

---

## Driver Pay Calculation

```
Main Total    = sum of all regular ticket pay amounts
Fuel Total    = sum of all fuel surcharge pay amounts
Driver Pay    = Main Total × percentage ÷ 100
             (or (Main Total + Fuel Total) × percentage ÷ 100 if fuel is included)
```

---

## Generated PDF Format

Each generated PDF contains:
- **Header**: AMILCAR TRUCKING LLC, report date, driver name, truck number
- **Ticket table**: one row per ticket with date, ticket #, quantity, pay rate, pay amount
- **Totals**: main total and final driver pay (highlighted in blue)
- The PDF is always a single page, sized to fit all tickets

---

## API Endpoints

| Method | Endpoint | What it does |
|--------|----------|-------------|
| POST | `/api/upload` | Upload a PDF and trigger parsing |
| GET | `/api/reports` | List all uploaded reports |
| GET | `/api/reports/{id}` | Full report with all tickets grouped by truck |
| DELETE | `/api/reports/{id}` | Delete a report |
| PUT | `/api/tickets/{id}` | Edit a ticket value |
| DELETE | `/api/tickets/{id}` | Delete a ticket |
| POST | `/api/reports/{id}/trucks/{truckId}/tickets` | Manually add a ticket |
| PUT | `/api/reports/{id}/trucks/{truckId}/driver` | Assign a driver to a truck |
| PUT | `/api/reports/{id}/totals/{truckId}` | Update percentage or fuel toggle |
| POST | `/api/reports/{id}/trucks/{truckId}/generate` | Generate the PDF |
| GET | `/api/reports/{id}/trucks/{truckId}/download` | Download the generated PDF |
| GET | `/api/drivers` | List all drivers |
| POST | `/api/drivers` | Create a driver |
| PUT | `/api/drivers/{id}` | Update a driver |
| DELETE | `/api/drivers/{id}` | Delete a driver |
| GET | `/api/trucks` | List all trucks |
| GET | `/api/trucks/{id}/reports` | Report history for a truck |
| GET | `/api/dashboard` | Summary stats for the dashboard |

---

## Notes

- Uploaded PDFs are saved in `backend/uploads/pdfs/`
- Generated report PDFs are saved in `backend/uploads/reports/`
- The Python service runs on port **5001** (not 5000, because macOS uses port 5000 for AirPlay)
- Hibernate automatically creates and updates the database schema on startup — no manual SQL needed
