trap "kill 0" EXIT

cd ~/Documents/ArcGISExperienceBuilder/server
npm start &
cd ../client
npm start &

wait
