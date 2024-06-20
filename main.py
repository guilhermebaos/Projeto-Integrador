import network
import time
from umqtt.simple import MQTTClient
from calibration import LEDs_calibration

freq_site = None
freq_labview = None

# Wi-Fi credentials
SSID = 'MEO-BA6030'
PASSWORD = '5f776fe517'

# MQTT server details
MQTT_SERVER = 'broker.emqx.io'
MQTT_PORT = 1883
MQTT_CLIENT_ID = 'mqttx_4adb74bb'  # Client ID from the picture
MQTT_TOPIC = 'afinador-site'

# Connect to Wi-Fi
def connect_wifi():
    wifi = network.WLAN(network.STA_IF)
    wifi.active(True)
    wifi.connect(SSID, PASSWORD)
    while not wifi.isconnected():
        print('Connecting to WiFi...')
        time.sleep(1)
    print('Connected to WiFi:', wifi.ifconfig())

# Callback function to handle incoming messages
def message_callback(topic, msg):
    global freq_site
    global freq_labview
    print('Received message from topic {}: {}'.format(topic, msg))
    try:
        msg_str = msg.decode('utf-8')
        site, ref = msg_str.split('|')
        freq_site = float(site)
        freq_labview = float(ref)
        dif = (freq_site - freq_labview) / freq_labview * 100
        LEDs_calibration(dif)
    except ValueError as error:
        print(error)

# Main function to connect to MQTT and subscribe to a topic
def main():
    connect_wifi()

    try:
        client = MQTTClient(MQTT_CLIENT_ID, MQTT_SERVER, MQTT_PORT)
        client.set_callback(message_callback)
        client.connect()
        print('Connected to MQTT broker')

        client.subscribe(MQTT_TOPIC)
        print('Subscribed to topic:', MQTT_TOPIC)

        while True:
            try:
                client.wait_msg()  # Wait for messages
            except OSError as e:
                print('Error waiting for message:', e)
                client.disconnect()
                time.sleep(1)
                client.connect()
                client.subscribe(MQTT_TOPIC)

    except Exception as e:
        print('Failed to connect to MQTT broker:', e)
        time.sleep(10)
        main()  # Retry connection

if __name__ == '__main__':
    main()
