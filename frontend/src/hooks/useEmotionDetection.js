import { useState, useEffect, useRef } from 'react';

const useEmotionDetection = () => {
    const [emotionData, setEmotionData] = useState(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    useEffect(() => {
        let socket;
        let intervalId;

        const initCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (err) {
                console.error("Camera access error:", err);
            }
        };

        const connectWebSocket = () => {
            socket = new WebSocket("ws://127.0.0.1:8000/ws/emotions/");

            socket.onopen = () => {
                console.log("WebSocket connection established.");
            };

            socket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                setEmotionData(data);
            };

            socket.onerror = (error) => {
                console.error("WebSocket error:", error);
            };
        };

        const sendFrame = () => {
            if (videoRef.current && canvasRef.current) {
                const context = canvasRef.current.getContext("2d");
                canvasRef.current.width = videoRef.current.videoWidth;
                canvasRef.current.height = videoRef.current.videoHeight;
                context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
                const frameData = canvasRef.current.toDataURL("image/jpeg", 0.8);
                if (socket && socket.readyState === WebSocket.OPEN) {
                    socket.send(JSON.stringify({ frame: frameData }));
                }
            }
        };

        const setup = async () => {
            await initCamera();
            connectWebSocket();
            intervalId = setInterval(sendFrame, 1000);
        };

        setup();

        return () => {
            clearInterval(intervalId);
            if (socket) {
                socket.close();
            }
        };
    }, []);

    return { emotionData, videoRef, canvasRef };
};

export default useEmotionDetection;
