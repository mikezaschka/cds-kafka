service OurService {

  action triggerEvent();

  @topic: 'cap.test.object.created.v1'
  event ObjectCreated {
    message : String;
  }
}
