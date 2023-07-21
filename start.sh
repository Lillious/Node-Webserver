clear
echo "Deployment Started"
pm2 stop app 2>&1 >/dev/null
echo "Removing Old Files"
pm2 delete Webserver 2>&1 >/dev/null
echo "Building Application"
npm run build 2>&1 >/dev/null
echo "Starting Application"
pm2 start ./app.sh --name "Webserver" 2>&1 >/dev/null
echo "Creating Daemon"
pm2 app 2>&1 >/dev/null
echo "Saving Configurations"
pm2 save 2>&1 >/dev/null
echo "Deployment Completed Successfully!"
pm2 flush app 2>&1 >/dev/null
exit 0