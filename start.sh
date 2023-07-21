clear
echo "Deployment Started"
pm2 stop app 2>&1 >/dev/null
echo "Removing Old Files"
pm2 delete app 2>&1 >/dev/null
echo "Building Application"
npm run build 2>&1 >/dev/null
echo "Starting Application"
pm2 start ./app.sh 2>&1 >/dev/null
echo "Creating Daemon"
pm2 app 2>&1 >/dev/null
echo "Saving Configurations"
pm2 save 2>&1 >/dev/null
echo "Deployment Completed Successfully!"
pm2 status app
pm2 flush app 2>&1 >/dev/null
pm2 logs app