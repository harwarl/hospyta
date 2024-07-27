import { join } from 'path';
import { MongoConnectionOptions } from 'typeorm/driver/mongodb/MongoConnectionOptions';

const config: MongoConnectionOptions = {
  type: 'mongodb',
  host: '127.0.0.1',
  port: 27017,
  database: 'hospyta-blog',
  password: '',
  entities: [join(__dirname, '**', '*.entity.{ts,js}')],
  useNewUrlParser: true,
  useUnifiedTopology: true,
  synchronize: false,
  logging: true,
};

export default config;
