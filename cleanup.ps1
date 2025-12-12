# -------------------------------------------------------------------
# CONFIG
# -------------------------------------------------------------------
$SERVICE = "casey"
$PROJECT = "coral-marker-245905"
$IMAGE = "gcr.io/${PROJECT}/${SERVICE}:latest"
$REPO_PATH = "gcr.io/${PROJECT}/${SERVICE}"

$pushedDigest = docker inspect $IMAGE `
    --format='{{index .RepoDigests 0}}'

# Assume $pushedDigest contains the pushed image, e.g.:
# gcr.io/coral-marker-245905/willmcvay@sha256:81e4f39a6c3c96bd...
# Extract just the digest portion
$activeDigest = ($pushedDigest -split "@")[-1]

Write-Host ("Active deployed image digest: {0}" -f $activeDigest) -ForegroundColor Cyan

# -------------------------------------------------------------------
# List all digests in the repository
# -------------------------------------------------------------------
$allDigests = gcloud container images list-tags $REPO_PATH `
    --format="get(digest)" `
    --limit=9999

if (-not $allDigests) {
    Write-Host "No images found in GCR repository $REPO_PATH. Nothing to clean." -ForegroundColor Yellow
    exit 0
}

# -------------------------------------------------------------------
# Delete all digests except the active one
# -------------------------------------------------------------------
foreach ($digest in $allDigests) {
    # List tags for this digest
    $tags = gcloud container images list-tags $REPO_PATH --filter="digest:$digest" --format="value(tags)"
    
    if ($digest -eq $activeDigest) {
        Write-Host "Preserving active digest: $digest" -ForegroundColor Green
    } elseif ($tags) {
        Write-Host "Skipping digest $digest because it still has tags: $tags" -ForegroundColor Yellow
    } else {
        Write-Host "Deleting unused digest: $digest" -ForegroundColor Cyan
        gcloud container images delete "$REPO_PATH@$digest" --quiet 2>$null

        if ($LASTEXITCODE -ne 0) {
            Write-Host "Failed to delete digest $digest, probably still referenced by layers. Skipping." -ForegroundColor Red
        }
    }
}

Write-Host "Cleanup complete." -ForegroundColor Cyan