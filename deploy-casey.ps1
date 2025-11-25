# deploy-casey.ps1
# Build, push, and deploy "casey" Cloud Run service (project assumed already set)

$ServiceName = "casey"
$Region = "us-central1"
$DockerTag = "latest"
$ProjectId = "coral-marker-245905"

# Safely interpolate variables using ${} everywhere
$Image = "gcr.io/${ProjectId}/${ServiceName}:${DockerTag}"

Write-Host "Building Docker image $Image..."
docker build -t $Image .

if ($LASTEXITCODE -ne 0) { 
    Write-Host "Docker build failed. Exiting." -ForegroundColor Red
    exit 1
}

Write-Host "Pushing Docker image to Container Registry..."
docker push $Image

if ($LASTEXITCODE -ne 0) { 
    Write-Host "Docker push failed. Exiting." -ForegroundColor Red
    exit 1
}

Write-Host "Deploying ${ServiceName} to Cloud Run in ${Region}..."
gcloud run deploy ${ServiceName} `
    --image ${Image} `
    --platform managed `
    --region ${Region} `
    --allow-unauthenticated

if ($LASTEXITCODE -ne 0) { 
    Write-Host "Cloud Run deploy failed." -ForegroundColor Red
    exit 1
}

Write-Host "`nDeployment complete! Check the Cloud Run URL above."
