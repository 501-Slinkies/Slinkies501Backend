# 🚀 GCR Quick Start - Deploy in 10 Minutes

Get your TeamSlinkies backend running on Google Cloud in 10 minutes!

## ⚡ Super Quick Start (3 Commands)

```bash
# 1. Setup Google Cloud
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
gcloud auth configure-docker

# 2. Build and push
docker build -t gcr.io/YOUR_PROJECT_ID/teamslinkies:latest .
docker push gcr.io/YOUR_PROJECT_ID/teamslinkies:latest

# 3. Deploy
gcloud run deploy teamslinkies \
  --image gcr.io/YOUR_PROJECT_ID/teamslinkies:latest \
  --region us-central1 \
  --allow-unauthenticated \
  --port 3000
```

**That's it!** Your backend is live at `https://teamslinkies-xxxxx-uc.a.run.app` 🎉

## 📋 Prerequisites (5 minutes)

### 1. Install Google Cloud SDK
```bash
# Windows: Download from https://cloud.google.com/sdk/docs/install
# macOS: brew install google-cloud-sdk
# Linux: curl https://sdk.cloud.google.com | bash
```

### 2. Create Google Cloud Project
```bash
# Create project (or use existing)
gcloud projects create your-project-id --name="TeamSlinkies"
gcloud config set project your-project-id

# Enable required APIs
gcloud services enable run.googleapis.com container.googleapis.com
```

### 3. Setup Authentication
```bash
# Login to Google Cloud
gcloud auth login

# Configure Docker for GCR
gcloud auth configure-docker
```

## 🔧 Step-by-Step Deployment

### Step 1: Build Your Image
```bash
# Navigate to your project
cd TeamSlinkies

# Build Docker image
docker build -t gcr.io/YOUR_PROJECT_ID/teamslinkies:latest .

# Tag for GCR
docker tag teamslinkies:latest gcr.io/YOUR_PROJECT_ID/teamslinkies:latest
```

### Step 2: Push to Google Container Registry
```bash
# Push to GCR
docker push gcr.io/YOUR_PROJECT_ID/teamslinkies:latest
```

### Step 3: Deploy to Cloud Run
```bash
# Deploy with basic configuration
gcloud run deploy teamslinkies \
  --image gcr.io/YOUR_PROJECT_ID/teamslinkies:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 3000 \
  --set-env-vars NODE_ENV=production
```

### Step 4: Get Your URL
```bash
# Get your public URL
gcloud run services describe teamslinkies \
  --region us-central1 \
  --format="value(status.url)"
```

## 🔐 Production Setup (Optional but Recommended)

### Add Secrets Management
```bash
# Create secrets in Google Secret Manager
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

### Add Firebase Service Account
```bash
# Create secret for Firebase
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

## 🧪 Test Your Deployment

### Basic Health Check
```bash
# Get your service URL
SERVICE_URL=$(gcloud run services describe teamslinkies --region us-central1 --format="value(status.url)")

# Test root endpoint
curl $SERVICE_URL

# Expected response: 🚀 Server is running!
```

### Test API Endpoints
```bash
# Test login endpoint
curl -X POST $SERVICE_URL/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","role":"admin"}'

# Test health endpoint (if you have one)
curl $SERVICE_URL/health
```

## 🔄 Update Your Deployment

### Rebuild and Redeploy
```bash
# Build new image
docker build -t gcr.io/YOUR_PROJECT_ID/teamslinkies:latest .

# Push to GCR
docker push gcr.io/YOUR_PROJECT_ID/teamslinkies:latest

# Update Cloud Run service
gcloud run services update teamslinkies \
  --region us-central1 \
  --image gcr.io/YOUR_PROJECT_ID/teamslinkies:latest
```

### Automatic CI/CD
```bash
# Create Cloud Build trigger for automatic deployments
gcloud builds triggers create github \
  --repo-name=YOUR_REPO \
  --repo-owner=YOUR_USERNAME \
  --branch-pattern="^main$" \
  --build-config=cloudbuild.yaml
```

## 📊 Monitor Your Deployment

### View Logs
```bash
# Real-time logs
gcloud logging read "resource.type=cloud_run_revision" --limit 50

# Service-specific logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=teamslinkies" --limit 50
```

### Check Service Status
```bash
# Service details
gcloud run services describe teamslinkies --region us-central1

# Service metrics
gcloud run services describe teamslinkies --region us-central1 --format="value(status)"
```

## 💰 Cost Optimization

### Set Resource Limits
```bash
# Deploy with resource limits
gcloud run deploy teamslinkies \
  --image gcr.io/YOUR_PROJECT_ID/teamslinkies:latest \
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
# Set minimum instances to 0 (saves money)
gcloud run services update teamslinkies \
  --region us-central1 \
  --min-instances 0
```

## 🛡️ Security Features (Automatic)

✅ **HTTPS/TLS** - Automatic SSL certificates  
✅ **DDoS Protection** - Built-in protection  
✅ **Firewall** - Automatic network security  
✅ **IAM** - Identity and access management  
✅ **Audit Logging** - All actions logged  
✅ **Secrets Management** - Secure secret storage  

## 🚨 Troubleshooting

### Common Issues

**1. "Image not found" error:**
```bash
# Check if image exists
gcloud container images list --repository gcr.io/YOUR_PROJECT_ID
```

**2. Service won't start:**
```bash
# Check logs for errors
gcloud logging read "resource.type=cloud_run_revision" --limit 50
```

**3. Environment variables not working:**
```bash
# Verify secrets exist
gcloud secrets list

# Check secret values
gcloud secrets versions access latest --secret="jwt-secret"
```

**4. Permission denied:**
```bash
# Ensure you have the right permissions
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="user:YOUR_EMAIL" \
  --role="roles/run.admin"
```

## 🎯 Next Steps

1. **Test your API** - Verify all endpoints work
2. **Set up monitoring** - Configure alerts and dashboards
3. **Configure custom domain** - Use your own domain
4. **Set up CI/CD** - Automatic deployments on git push
5. **Review security** - Check IAM and secrets

## 📚 Additional Resources

- **Complete Guide**: `GCR_DEPLOYMENT_GUIDE.md`
- **Google Cloud Run Docs**: https://cloud.google.com/run/docs
- **Container Registry Docs**: https://cloud.google.com/container-registry/docs
- **Cloud Run Pricing**: https://cloud.google.com/run/pricing

## 🎉 Success!

Your TeamSlinkies backend is now running on Google Cloud with:
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Auto-scaling
- ✅ Pay-per-use pricing
- ✅ Enterprise security

**Your API is live and ready to use!** 🚀

---

**Need help?** Check the complete guide in `GCR_DEPLOYMENT_GUIDE.md` or refer to the Google Cloud documentation.

**Version**: 1.0.0  
**Last Updated**: October 2025
