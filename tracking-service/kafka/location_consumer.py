import json
from aiokafka import AIOKafkaConsumer

async def start_kafka_listeners():
    # كيتصنت للـ Events اللي كيصيفط الـ Parcel-Service والـ Users-Service
    consumer = AIOKafkaConsumer(
        'parcel-events', 'user-creation-topic',
        bootstrap_servers='localhost:9092',
        group_id="tracking-service-group"
    )
    await consumer.start()
    try:
        async for msg in consumer:
            data = json.loads(msg.value.decode('utf-8'))
            topic = msg.topic
            print(f"📥 Received event from {topic}: {data}")

            # هنا تقدري تزايدي Logic: مثلا إيلا تكريا Parcel جديد،
            # السيرفيس ديال التتبع يجهز بلاصة فـ MongoDB
    finally:
        await consumer.stop()