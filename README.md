# [PromptPilot](https://promptpilot.online/) <img src="https://promptpilot.online/favicon.ico" alt="PromptPilot" style="width:28px;"> - AI Prompt Guide & Enhancer 

**PromptPilot** is an AI - powered web application designed to assist users in generating and enhancing prompts for various generative AI models. It offers a quick generation feature for simple needs and a unique conversational guide (Masterful Prompt Creator) for crafting high - quality, detailed prompts. This repository contains the codebase for PromptPilot.

## ✨ Features
This application focuses on two core functionalities:

1.  **🚀 Quick Prompt Generation:**
    *   Accepts a simple keyword or short phrase from the user.
    *   Leverages AI to generate one or more basic, ready - to - use prompts based on the input.
    *   Ideal for users needing a fast starting point.

2.  **🧠 Guided Q&A Prompt Enhancement :**
    *   Provides an interactive, chat - like interface.
    *   Guides the user through a series of questions using AI.
    *   Helps users articulate and refine their requirements in detail.
    *   Generates a comprehensive, high - quality prompt based on the guided conversation.
    *   Aims to significantly improve the relevance and quality of AI outputs.

## 🚀 Getting Started

### Prerequisites
*   Node.js and npm (or yarn) for frontend/backend (depending on your tech stack)
*   Docker and Docker Compose (optional, but recommended for easier setup)

### Step 1: Clone the repository
```bash
git clone https://github.com/FelixFoster/mcp-enhance-prompt # Replace with your actual repo URL
cd mcp-enhance-prompt
```


### Step 2: Install Dependencies
Navigate into the relevant directories and install the dependencies.
```bash
npm install
```

### Step 4: Build the Project
```bash
npm run build
```

### Step 5: Run the Application
You have several options to run the application:

#### Option 1: Run Directly
```bash
node build/index.js
```

#### Option 2: Run with Docker
```bash
docker build -t enhance-prompt-server .
docker run -i --rm enhance-prompt-server
```

#### Option 3: Run with npx
```bash
npx -y enhance-prompt-server
```

### Step 6: Access the Application
Open your web browser and navigate to the address where your frontend application is served (e.g., `http://localhost:9593/rest`).

## 🐛 Troubleshooting
*   **Backend Logs:** Check the console logs of your backend process for error messages.
*   **Network Issues:** Ensure your backend is running on the correct port and that there are no firewall issues blocking access. If using Docker, verify port mappings.
*   **Dependencies:** Make sure all project dependencies were installed successfully.


## 🤝 Contributing
Contributions are welcome! If you'd like to contribute to PromptPilot, please follow these steps:
1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/your - feature`).
3.  Make your changes.
4.  Commit your changes (`git commit -am 'feat: Add new feature X'`).
5.  Push to the branch (`git push origin feature/your - feature`).
6.  Create a new Pull Request.

Please ensure your code follows the project's coding standards and include tests where appropriate.

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.


