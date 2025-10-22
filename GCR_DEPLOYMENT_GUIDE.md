# 🚀 Google Container Registry (GCR) Deployment Guide

Complete guide to deploy your TeamSlinkies backend to Google Cloud using Container Registry and Cloud Run.

## 📋 Prerequisites

- Google Cloud account (free tier available)
- Docker installed locally
- Google Cloud SDK (gcloud CLI)
- Your TeamSlinkies application ready

## 🔧 Step 1: Setup Google Cloud

### Install Google Cloud SDK

**Windows:**
```bash
# Download and install from:
# https://cloud.google.com/sdk/docs/install
```

**macOS:**
```bash
brew install google-cloud-sdk
```

**Linux:**
```bash
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
```

### Initialize gcloud
```bash
# Login to Google Cloud
gcloud auth login

# Set your project (create one if needed)
gcloud config set project YOUR_PROJECT_ID

# Enable required APIs
gcloud services enable container.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

## 🐳 Step 2: Build and Push to GCR

### Configure Docker for GCR
```bash
# Configure Docker to use gcloud credentials
gcloud auth configure-docker
```

### Build and Push Your Image
```bash
# Navigate to your project directory
cd TeamSlinkies

# Build your Docker image
docker build -t teamslinkies:latest .

# Tag for GCR (replace YOUR_PROJECT_ID)
docker tag teamslinkies:latest gcr.io/YOUR_PROJECT_ID/teamslinkies:latest

# Push to Google Container Registry
docker push gcr.io/YOUR_PROJECT_ID/teamslinkies:latest
```

## 🚀 Step 3: Deploy to Cloud Run

### Deploy with Environment Variables
```bash
# Deploy to Cloud Run with public access
gcloud run deploy teamslinkies \
  --image gcr.io/YOUR_PROJECT_ID/teamslinkies:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 3000 \
  --set-env-vars NODE_ENV=production
```

### Deploy with Secrets (Recommended for Production)
```bash
# First, create secrets in Google Secret Manager
gcloud secrets create jwt-secret --data-file=- <<< "your-64-byte-jwt-secret"
gcloud secrets create encryption-key --data-file=- <<< "your-32-byte-encryption-key"
gcloud secrets create sendgrid-api-key --data-file=- <<< "your-sendgrid-key"
gcloud secrets create twilio-account-sid --data-file=- <<< "your-twilio-sid"
gcloud secrets create twilio-auth-token --data-file=- <<< "your-twilio-token"

# Deploy with secrets
gcloud run deploy teamslinkies \
  --image gcr.io/YOUR_PROJECT_ID/teamslinkies:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 3000 \
  --set-env-vars NODE_ENV=production \
  --set-secrets JWT_SECRET=jwt-secret:latest,ENCRYPTION_KEY=encryption-key:latest,SENDGRID_API_KEY=sendgrid-api-key:latest,TWILIO_ACCOUNT_SID=twilio-account-sid:latest,TWILIO_AUTH_TOKEN=twilio-auth-token:latest
```

## 🔐 Step 4: Configure Firebase/Firestore

### Upload Service Account Key
```bash
# Create a secret for your Firebase service account
gcloud secrets create firebase-service-account --data-file=serviceAccountKey.json

# Deploy with Firebase secret
gcloud run deploy teamslinkies \
  --image gcr.io/YOUR_PROJECT_ID/teamslinkies:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 3000 \
  --set-secrets FIREBASE_SERVICE_ACCOUNT=firebase-service-account:latest
```

### Update Your Application Code
You'll need to modify your `firebase.js` to read from the mounted secret:

```javascript
// firebase.js - Updated for Cloud Run
const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const admin = require("firebase-admin");

if (!admin.apps.length) {
    if (process.env.FIRESTORE_EMULATOR_HOST) {
        // Development emulator
        initializeApp({
            projectId: "dev-project",
        });
        console.log("Firebase Admin connected to Firestore Emulator");
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        // Production with mounted secret
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        initializeApp({
            credential: cert(serviceAccount),
        });
        console.log("Firebase Admin connected to Production Firestore");
    } else {
        // Fallback to file (for local development)
        const serviceAccount = require("./serviceAccountKey.json");
        initializeApp({
            credential: cert(serviceAccount),
        });
        console.log("Firebase Admin connected to Production Firestore");
    }
}

const db = getFirestore();
module.exports = { admin, db };
```

## 🌐 Step 5: Get Your Public URL

```bash
# Get your Cloud Run service URL
gcloud run services describe teamslinkies \
  --platform managed \
  --region us-central1 \
  --format="value(status.url)"
```

Your backend will be available at: `https://teamslinkies-xxxxx-uc.a.run.app`

## 🔧 Step 6: Configure Custom Domain (Optional)

### Add Custom Domain
```bash
# Map a custom domain to your Cloud Run service
gcloud run domain-mappings create \
  --service teamslinkies \
  --domain api.yourdomain.com \
  --region us-central1
```

### SSL Certificate (Automatic)
Cloud Run automatically provisions SSL certificates for your domains.

## 📊 Step 7: Monitoring and Logging

### View Logs
```bash
# View real-time logs
gcloud logging read "resource.type=cloud_run_revision" --limit 50

# View logs for your specific service
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=teamslinkies" --limit 50
```

### Set Up Monitoring
```bash
# Enable Cloud Monitoring
gcloud services enable monitoring.googleapis.com

# View metrics in Cloud Console
# Go to: https://console.cloud.google.com/monitoring
```

## 🔄 Step 8: CI/CD Pipeline

### Create Cloud Build Trigger
```bash
# Create a build trigger for automatic deployments
gcloud builds triggers create github \
  --repo-name=YOUR_GITHUB_REPO \
  --repo-owner=YOUR_GITHUB_USERNAME \
  --branch-pattern="^main$" \
  --build-config=cloudbuild.yaml
```

### Create cloudbuild.yaml
```yaml
# cloudbuild.yaml
steps:
  # Build the container image
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/teamslinkies:$COMMIT_SHA', '.']
  
  # Push the container image to Container Registry
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/teamslinkies:$COMMIT_SHA']
  
  # Deploy container image to Cloud Run
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - 'run'
      - 'deploy'
      - 'teamslinkies'
      - '--image'
      - 'gcr.io/$PROJECT_ID/teamslinkies:$COMMIT_SHA'
      - '--region'
      - 'us-central1'
      - '--platform'
      - 'managed'
      - '--allow-unauthenticated'
      - '--port'
      - '3000'
```

## 💰 Step 9: Cost Optimization

### Set Resource Limits
```bash
# Deploy with resource limits
gcloud run deploy teamslinkies \
  --image gcr.io/YOUR_PROJECT_ID/teamslinkies:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 3000 \
  --memory 512Mi \
  --cpu 1 \
  --max-instances 10 \
  --min-instances 0
```

### Enable Request-based Billing
```bash
# Set minimum instances to 0 for cost savings
gcloud run services update teamslinkies \
  --region us-central1 \
  --min-instances 0 \
  --max-instances 10
```

## 🛡️ Step 10: Security Best Practices

### Enable IAM
```bash
# Create a service account for your app
gcloud iam service-accounts create teamslinkies-sa \
  --display-name "TeamSlinkies Service Account"

# Grant necessary permissions
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:teamslinkies-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### Network Security
```bash
# Deploy with VPC connector (if needed)
gcloud run deploy teamslinkies \
  --image gcr.io/YOUR_PROJECT_ID/teamslinkies:latest \
  --platform managed \
  --region us-central1 \
  --vpc-connector YOUR_VPC_CONNECTOR \
  --vpc-egress private-ranges-only
```

## 🧪 Step 11: Testing Your Deployment

### Test Your API
```bash
# Get your service URL
SERVICE_URL=$(gcloud run services describe teamslinkies --region us-central1 --format="value(status.url)")

# Test the root endpoint
curl $SERVICE_URL

# Test login endpoint
curl -X POST $SERVICE_URL/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","role":"admin"}'
```

### Health Check
```bash
# Check service health
curl $SERVICE_URL/health
```

## 🔧 Troubleshooting

### Common Issues

**1. Image not found:**
```bash
# Verify image exists
gcloud container images list --repository gcr.io/YOUR_PROJECT_ID

# Check image tags
gcloud container images list-tags gcr.io/YOUR_PROJECT_ID/teamslinkies
```

**2. Service won't start:**
```bash
# Check logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=teamslinkies" --limit 50

# Check service status
gcloud run services describe teamslinkies --region us-central1
```

**3. Environment variables not working:**
```bash
# Verify secrets exist
gcloud secrets list

# Check secret values
gcloud secrets versions access latest --secret="jwt-secret"
```

## 📚 Additional Resources

- [Google Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Container Registry Documentation](https://cloud.google.com/container-registry/docs)
- [Cloud Run Pricing](https://cloud.google.com/run/pricing)
- [Cloud Run Best Practices](https://cloud.google.com/run/docs/best-practices)

## 🎯 Quick Commands Reference

```bash
# Build and push
docker build -t gcr.io/YOUR_PROJECT_ID/teamslinkies:latest .
docker push gcr.io/YOUR_PROJECT_ID/teamslinkies:latest

# Deploy
gcloud run deploy teamslinkies --image gcr.io/YOUR_PROJECT_ID/teamslinkies:latest --region us-central1 --allow-unauthenticated

# View logs
gcloud logging read "resource.type=cloud_run_revision" --limit 50

# Get URL
gcloud run services describe teamslinkies --region us-central1 --format="value(status.url)"

# Update service
gcloud run services update teamslinkies --region us-central1 --image gcr.io/YOUR_PROJECT_ID/teamslinkies:latest
```

---

**Your TeamSlinkies backend is now running on Google Cloud! 🚀**

**Next Steps:**
1. Test your API endpoints
2. Set up monitoring and alerts
3. Configure custom domain (optional)
4. Set up CI/CD pipeline
5. Review security settings

---

**Version**: 1.0.0  
**Last Updated**: October 2025
