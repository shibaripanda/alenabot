import { Button, Center, Space } from "@mantine/core";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createSocket } from "../../utils/socket";

export function DashboardPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }
    const socket = createSocket(token);
    socket.on('connect', () => {
      console.log('Connected', socket.id);
    });
    socket.on('message', (msg) => {
      console.log('Message:', msg);
    });
    socket.on('connect_error', (err) => {
      console.error('Connection error:', err.message);
    });
    return () => {
      socket.disconnect();
    };
  }, [navigate]);

  if(sessionStorage.getItem('token')){
    return (
      <>
        <Center>
          Dashboard
          <Space/>
          <Button onClick={() => {
            sessionStorage.removeItem('token')
            navigate('/')
          }}>
            Exit
          </Button>
        </Center>
      </>
    );
  }
}
