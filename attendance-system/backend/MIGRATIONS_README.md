Sequelize migrations quick guide

- Configure DB path via environment variable `DB_PATH` or use defaults in `config/config.json`.
- To run migrations:
  - npm run migrate
- To undo last migration:
  - npm run migrate:undo

Note: Avoid running automatic schema sync in production. Use committed migration files for any schema changes.
