echo "Preparing Deployment..."
echo "Packaging Lambda Functions..."

mkdir -p build
zip -r build/lambdas.zip src/

echo "Packaging Complete!"
echo "Starting Deployment..."

aws cloudformation deploy --template ./resources.json --stack-name cody-richter-cooks --capabilities CAPABILITY_IAM