using {cap.kafka.db as db} from '../db/model';

service PublicService {
  entity Messages as projection on db.Messages;
}
