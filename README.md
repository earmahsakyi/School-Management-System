# 🏫 School Management System (MERN)

A full-stack **School Management System** built using the **MERN stack** (MongoDB, Express, React, Node.js).  
This system provides an end-to-end solution for managing students, teachers, grades, attendance, and report cards with admin and parent roles.

---

## 🚀 Features

### 👩‍💻 Admin
- Add, update, and manage students & parents
- Assign grade levels, departments, and sections
- Manage promotions with history tracking
- Generate and print professional report cards
- Upload photos, transcripts, and report cards
- Secure authentication and authorization (JWT)

### 📚 Teachers
- Record subject scores and semester grades
- Track attendance, tardiness, and conduct
- Generate academic performance reports

### 👨‍👩‍👧 Parents / Students
- View report cards online
- Check grades and attendance records
- Receive promotion/academic status updates

---

## 🛠 Tech Stack

- **Frontend:** React + Redux + TailwindCSS + Framer Motion  
- **Backend:** Node.js + Express  
- **Database:** MongoDB + Mongoose  
- **Authentication:** JWT + bcrypt  
- **Other Tools:** Multer (file upload), Puppeteer/jsPDF (report card PDF generation), Nodemon (dev server)  

---

## 📂 Folder Structure

project-root/
│── client/ # React frontend (runs from project root)
│ ├── src/
│ └── package.json
│
│ # Express backend
│── models/ # Mongoose models (Student, Parent, Grade, PromotionRecord, etc.)
│── controllers/ # Business logic
│── routes/ # API routes
│── middleware/ # Auth, uploads, error handling
│── config/ # DB & environment setup
│── server.js
│
├── .env # Environment variables
├── package.json # Root (concurrently runs client & server)
└── README.md

## ⚙️ Installation & Setup

### 1️⃣ Clone Repository
```bash
git clone https://github.com/yourusername/school-management-system.git
cd school-management-system

2️⃣ Install Dependencies

Install root + client + server packages:

npm install
cd client && npm install
cd ../ && npm install

MONGO_URI=your_mongo_db_connection_string
JWT_SECRET=your_jwt_secret
secretKey= your_secretkey
PORT=5000
RESEND_API =your_resend_api

 ## Run the Application

From the project root, run both frontend and backend concurrently:

npm run dev
Client runs on: http://localhost:3000
Server runs on: http://localhost:5000

📸 Screenshots
landingPage
<img width="1920" height="969" alt="LandingPage (2)" src="https://github.com/user-attachments/assets/47a3322b-10f9-4576-a882-9b714f125df8" />

Login page
<img width="1920" height="970" alt="Login Page" src="https://github.com/user-attachments/assets/e261afa8-64ca-4d26-a0f1-6060334eb293" />
Sign Up page
<img width="1920" height="978" alt="Sign up page" src="https://github.com/user-attachments/assets/8d36ba77-ec41-4107-948e-469271322902" />
dashboard
<img width="1920" height="964" alt="dashboard" src="https://github.com/user-attachments/assets/b103a69b-5acf-4be6-9e5e-c7c0f3956121" />
student section
<img width="1920" height="975" alt="students section" src="https://github.com/user-attachments/assets/821bb018-6eb1-48aa-b851-f6ecf196387f" />
student performance
<img width="1920" height="974" alt="student performanc analysis" src="https://github.com/user-attachments/assets/cf08811a-a25a-4b2c-af95-f665dfe5d198" />

🤝 Contribution

Pull requests are welcome! For major changes, please open an issue first to discuss your idea.

📜 License
This project is licensed under the MIT License.


