# Nourished

Gamified Social Wellness App

---

## Getting Started

How to set up the project locally.

### Prerequisites

Ensure the following are installed or configured:

- [Node.js](https://nodejs.org/) installed on your machine.

  - To install Node.js go to the [Node.js website](https://nodejs.org/) and download the installer for your operating system. Follow the instructions to install Node.js (LTS).
  - After installation, you can verify the installation by running the following command in your terminal:

    ```bash
    node -v
    ```

- `.env` & `.local.env` files are correctly configured

You can find all required environment files in the **Shared Folder on Google Drive**.

#### Required Files

- In the **project root**, ensure you have the following files:
  - `.env`
- In the **frontend** (`frontend/nourished`) directory, ensure you have the following files:
  - `.local.env`

---

## Install Dependencies

Install all required dependencies:

```bash
# For the backend
cd backend
npm install

# For the frontend
cd frontend/nourished
npm install
```

## Run the Project

### Backend

To run the backend server, navigate to the `backend` directory and use the following command:

```bash
npm run dev
```

### Frontend

To run the frontend application, navigate to the `frontend/nourished` directory and use the following command:

```bash
npm run dev
```

This will start the development server, and you can access the application at `http://localhost:3000`.
