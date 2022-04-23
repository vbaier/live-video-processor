cd ./research-web
npm run dev-all
cd ..
docker-compose -f ./debug-compose.yml down
docker-compose -f ./debug-compose.yml build
docker-compose -f ./debug-compose.yml up &
cd ./research-web
pipenv install --dev
pipenv run python manage.py collectstatic --noinput
pipenv run manage.py runserver &