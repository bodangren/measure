# Skills Catalog

This catalog defines skills available to the Measure framework for Claude Code.

## Firebase Skills

### firebase-ai-logic-basics
- **Description**: Integrate Firebase AI Logic (Gemini API) into web applications. Covers setup, multimodal inference, structured output, and security.
- **URL**: https://raw.githubusercontent.com/firebase/agent-skills/main/skills/firebase-ai-logic-basics/
- **Detection Signals**:
  - **Dependencies**: `firebase`, `firebase-admin`
  - **Keywords**: `Firebase`, `AI Logic`, `Gemini API`, `GenAI`

### firebase-app-hosting-basics
- **Description**: Deploy and manage web apps with Firebase App Hosting. Use this skill when deploying Next.js/Angular apps with backends.
- **URL**: https://raw.githubusercontent.com/firebase/agent-skills/main/skills/firebase-app-hosting-basics/
- **Detection Signals**:
  - **Dependencies**: `firebase`, `firebase-admin`
  - **Keywords**: `Firebase App Hosting`, `Next.js`, `Angular`

### firebase-auth-basics
- **Description**: Set up and use Firebase Authentication. Use when the app requires user sign-in, user management, or secure data access.
- **URL**: https://raw.githubusercontent.com/firebase/agent-skills/main/skills/firebase-auth-basics/
- **Detection Signals**:
  - **Dependencies**: `firebase`, `firebase-admin`
  - **Keywords**: `Firebase Authentication`, `Auth`, `Sign-in`

### firebase-basics
- **Description**: Get started with Firebase - setting up local environment, using Firebase for the first time, or adding Firebase to an app.
- **URL**: https://raw.githubusercontent.com/firebase/agent-skills/main/skills/firebase-basics/
- **Detection Signals**:
  - **Dependencies**: `firebase`, `firebase-admin`
  - **Keywords**: `Firebase`, `Setup`

### firebase-data-connect-basics
- **Description**: Build and deploy Firebase Data Connect backends with PostgreSQL. For schema design, GraphQL queries/mutations, authorization, and SDK generation.
- **URL**: https://raw.githubusercontent.com/firebase/agent-skills/main/skills/firebase-data-connect-basics/
- **Detection Signals**:
  - **Dependencies**: `firebase`, `firebase-admin`
  - **Keywords**: `Firebase Data Connect`, `PostgreSQL`, `GraphQL`

### firebase-firestore-basics
- **Description**: Firestore basics including provisioning, security rules, and SDK usage. Use when setting up Firestore, writing security rules, or using the Firestore SDK.
- **URL**: https://raw.githubusercontent.com/firebase/agent-skills/main/skills/firebase-firestore-basics/
- **Detection Signals**:
  - **Dependencies**: `firebase`, `firebase-admin`
  - **Keywords**: `Firestore`, `Database`, `Security Rules`

### firebase-hosting-basics
- **Description**: Deploy static web apps, Single Page Apps (SPAs), or simple microservices with Firebase Hosting.
- **URL**: https://raw.githubusercontent.com/firebase/agent-skills/main/skills/firebase-hosting-basics/
- **Detection Signals**:
  - **Dependencies**: `firebase`, `firebase-admin`
  - **Keywords**: `Firebase Hosting`, `Static Hosting`

## DevOps Skills

### cloud-deploy-pipelines
- **Description**: Manage the entire lifecycle of Google Cloud Deploy, from designing and creating delivery pipelines to managing releases and debugging failures.
- **URL**: https://raw.githubusercontent.com/gemini-cli-extensions/devops/main/skills/cloud-deploy-pipelines/
- **Detection Signals**:
  - **Dependencies**: `skaffold`
  - **Keywords**: `Cloud Deploy`, `delivery pipeline`, `skaffold.yaml`, `clouddeploy.yaml`

### gcp-cicd-deploy
- **Description**: Deploy applications to Google Cloud supporting Static Sites (GCS), Cloud Run (Buildpacks or Images), and GKE.
- **URL**: https://raw.githubusercontent.com/gemini-cli-extensions/devops/main/skills/gcp-cicd-deploy/
- **Detection Signals**:
  - **Dependencies**: `gcloud`
  - **Keywords**: `Cloud Run`, `GCS`, `Static Site`, `Deployment`, `Google Cloud`

### gcp-cicd-design
- **Description**: Design, build, and manage CI/CD pipelines on Google Cloud, focusing on architectural design and implementation planning.
- **URL**: https://raw.githubusercontent.com/gemini-cli-extensions/devops/main/skills/gcp-cicd-design/
- **Detection Signals**:
  - **Keywords**: `CI/CD`, `Pipeline Design`, `Google Cloud`, `Architectural Design`

### gcp-cicd-terraform
- **Description**: Use Terraform to provision Google Cloud resources (GKE, Cloud Run, Cloud SQL) with standard GCS backend state management and IAM least-privilege.
- **URL**: https://raw.githubusercontent.com/gemini-cli-extensions/devops/main/skills/gcp-cicd-terraform/
- **Detection Signals**:
  - **Dependencies**: `terraform`
  - **Keywords**: `Terraform`, `GCP`, `GCS Backend`, `Infrastructure as Code`, `IaC`
