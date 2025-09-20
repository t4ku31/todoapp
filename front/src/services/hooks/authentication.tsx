import axios from 'axios'
import { useNavigate } from 'react-router-dom';

interface Auth {
    email: string
    password: string
}
export function SigninHook() {
    async (authInfo: Auth) => {
        const navigate = useNavigate();
        try {
            const res = axios.post('spring-app:8080/auth/signin', { email: authInfo.email, password: authInfo.password });
            navigate("/todo");
        } catch (err) {
            alert("ログイン失敗");
        }
    }
}