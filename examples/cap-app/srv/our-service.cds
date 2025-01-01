using {test.db as model} from '../db/model';


service OurService {

  entity Foo as projection on model.Foo;

  @topic: 'cap.test.object.created.v1'
  event created {
    key ID1  : String;
    key ID2  : String;
        name : String;
  }
}
