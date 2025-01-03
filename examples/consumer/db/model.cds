namespace cap.kafka.db;

entity Messages {
  key ID      : UUID;
      headers : LargeString;
      data    : LargeString;
}
