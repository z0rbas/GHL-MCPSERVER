... (existing imports)
import path from 'path';
... (inside Express setup)
app.use('/.well-known',
  express.static(path.join(__dirname, '../public/.well-known'))
);
