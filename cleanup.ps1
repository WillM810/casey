# -------------------------------------------------------------------
# CONFIG
# -------------------------------------------------------------------
$SERVICE  = "casey"
$PROJECT  = "casey-website-481117"
$REGION   = "us-central1"
$REPO     = "casey"

$IMAGE_PATH = "${REGION}-docker.pkg.dev/$PROJECT/$REPO/$SERVICE"

Write-Host "Listing digests for package $IMAGE_PATH ..." -ForegroundColor Cyan

# -------------------------------------------------------------------
# Get all digests in the package
# -------------------------------------------------------------------
$allDigestsJson = gcloud artifacts docker images list $IMAGE_PATH `
    --project $PROJECT `
    --format="json" 2>$null

$allDigests = ($allDigestsJson | ConvertFrom-Json) | ForEach-Object { $_.version }

if (-not $allDigests) {
    Write-Host "No digests found. Nothing to clean." -ForegroundColor Yellow
    exit 0
}

Write-Host "Listing tags for package $IMAGE_PATH ..." -ForegroundColor Cyan

# Get all tags for the package
$tagListJson = gcloud artifacts docker tags list "$IMAGE_PATH" --format=json 2>$null

$tags = $tagListJson | ConvertFrom-Json

Write-Host $tags

# Find the digest that has the 'latest' tag
$latestDigest = ($tags | Where-Object { $_.tag -like "*/latest" }).version
$latestDigestShort = ($latestDigest -split "/")[-1]

if (-not $latestDigest) {
    Write-Host "Warning: no 'latest' tag found. Will not preserve any digest by tag." -ForegroundColor Yellow
} else {
    Write-Host "Active digest (latest): $latestDigestShort" -ForegroundColor Green
}

Write-Host "Total digests found: $($allDigests.Count)" -ForegroundColor Cyan

# -------------------------------------------------------------------
# Cleanup loop
# -------------------------------------------------------------------
foreach ($digest in $allDigests) {

    if ($digest -eq $latestDigestShort) {
        Write-Host "Preserving active digest: $digest" -ForegroundColor Green
        continue
    }

    if ($taggedDigests -contains $digest) {
        Write-Host "Skipping digest with tag(s): $digest" -ForegroundColor Yellow
        continue
    }

    Write-Host "Deleting unused digest: $digest" -ForegroundColor Cyan

    gcloud artifacts docker images delete "$IMAGE_PATH@$digest" `
        --quiet 2>$null

    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to delete digest $digest. Skipping." -ForegroundColor Red
    }
}

Write-Host "Cleanup complete." -ForegroundColor Cyan
