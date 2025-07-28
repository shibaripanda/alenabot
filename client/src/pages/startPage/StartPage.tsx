import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { ColorSchemeToggle } from "../../components/colorSchemeToggle/ColorSchemeToggle";
import { TitleWelcom } from "../../components/title/TitleWelcom";

export function StartPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<string>('CLOSE')
  const navigate = useNavigate();
  console.log(token)
  console.log(import.meta.env.VITE_WEB_URL)

  useEffect(() => {
    if(token){
      console.log('ENTER AUTH')
      auth()
    }
    else if(sessionStorage.getItem('token')){
      console.log('REDY FOR WORK')
      setStatus('GAMEBOT')
      navigate('/dashboard')
    }
    else{
      console.log('CLOSE AUTH')
      setStatus('CLOSE')
    }
  }, [])

  const auth = async () => {
    console.log('start auth')
    await axios.get(`${import.meta.env.VITE_WEB_URL}/access/${token}`)
    .then((res) => {
      console.log(res.data)
      sessionStorage.setItem('token', res.data.token)
      console.log(sessionStorage.getItem('token'))
      navigate('/dashboard')
    })
    .catch((e) => {
      console.log(e.response.data.message)
    })
  }

  return (
    <>
      <TitleWelcom title={status}/>
      <ColorSchemeToggle/>
    </>
  );
}
