cd ./research-web
npm run dev-all
pipenv run python manage.py collectstatic --noinput
sudo cp -fr ./build/* /var/www
cd ..