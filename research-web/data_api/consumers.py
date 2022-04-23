# chat/consumers.py
from channels.generic.websocket import AsyncWebsocketConsumer
import json, asyncio, numpy, cv2
#import zstandard as zstd
import gzip
import time


class PerfTimer:
    start_time = 0
    events = []

    @staticmethod
    def reset():
        PerfTimer.events = []
        PerfTimer.start_time = time.perf_counter()

    @staticmethod
    def add_event(event_name):
        event_time = (time.perf_counter() - PerfTimer.start_time)*1000
        PerfTimer.events.append((event_time, event_name))

    @staticmethod
    def print_timer():
        for event in PerfTimer.events:
            print("{0:.4f} - {1:s}".format(event[0], event[1]))


class DataApiConsumer(AsyncWebsocketConsumer):
    def __init__(self, *args, **kwargs):

        super().__init__(*args, **kwargs)
        self.connected = False
        self.input_sequence = numpy.arange(0, 4.0*numpy.pi, numpy.pi/100.0)
        self.data_index = 0
        self.data_step = 10
        self.data_span = 150

    async def connect(self):
        print("connected")
        await self.accept()

        self.connected = True

        while self.connected:
            await asyncio.sleep(0.1)

            i = self.data_index
            step = self.data_step
            span = self.data_span
            x = self.input_sequence[i:i+span]
            y = numpy.sin(x)
            data = {
                        #"x": x.tolist(),
                        "y": y.tolist()
            }

            await self.send(json.dumps(data))

            self.data_index += step
            self.data_index %= int(len(self.input_sequence)/2)

    async def websocket_receive(self, event):
        print("receive", event)

    async def websocket_disconnect(self, event):
        print("disconnected", event)
        self.connected = False

def bytesToImage(bytes_data):

    #decompress the frame
    #dctx = zstd.ZstdDecompressor()
    #decompressed = dctx.decompress(bytes_data)
    decompressed = gzip.decompress(bytes_data)
    PerfTimer.add_event("Decompression Complete")

    # Assemble buffer into array
    dt = numpy.dtype(numpy.uint8)
    scratchArray = numpy.frombuffer(decompressed, dtype=dt)

    # Permute array to appropriate 3D shape
    scratchArray = numpy.reshape(scratchArray,(150,300,4),'C')
    outputImage = numpy.array(scratchArray)

    # Swap channels from RGBA to BGRA
    outputImage[:, :, 0] = scratchArray[:, :, 2]
    outputImage[:, :, 2] = scratchArray[:, :, 0]
    PerfTimer.add_event("Bytes->Image Conversion Complete")

    return outputImage

def imageToBytes(image):

    # Re-order from BGRA to RGBA
    scratchImage = numpy.array(image)
    scratchImage[:, :, 0] = image[:, :, 2]
    scratchImage[:, :, 2] = image[:, :, 0]

    # Flatten back to 1D array
    scratchArray = numpy.reshape(scratchImage, (180000), 'C')

    # Extract bytes
    bytes = scratchArray.tobytes()
    PerfTimer.add_event("Image->Bytes Conversion Complete")

    return bytes

def deleteRedChanel(image):
    image[:,:,2] = 0
    PerfTimer.add_event("Red Channel Deleted")
    return image

def computeFrame(bytes_data):
    image = bytesToImage(bytes_data)
    image = deleteRedChanel(image)
    bytes_data = imageToBytes(image)
    return bytes_data

class ImageConsumer(AsyncWebsocketConsumer):
    def __init__(self, *args, **kwargs):

        super().__init__(*args, **kwargs)
        self.connected = False
        self.input_sequence = numpy.arange(0, 4.0*numpy.pi, numpy.pi/100.0)
        self.data_index = 0
        self.data_step = 10
        self.data_span = 150

    async def connect(self):
        print("connected")
        await self.accept()

    async def disconnect(self, event):
        print("disconnected", event)

    # Receive message from WebSocket
    async def receive(self, text_data=None, bytes_data=None):
        if text_data:
            print('Unexpected text data: ' + text_data)
        if bytes_data:
            PerfTimer.add_event("Receive Complete")
            PerfTimer.print_timer()
            PerfTimer.reset()
            bytes_data = computeFrame(bytes_data)
            await self.send(bytes_data=bytes_data)
            PerfTimer.add_event("Send Complete")

        # Send message to WebSocket

