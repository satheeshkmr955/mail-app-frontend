import axios from "axios";

const instance = axios.create({
  baseURL: "http://localhost:5000/api/v1",
});

export const authServices = {
  signup: ({ data = {} }) => {
    return instance.post("/user/signup", data);
  },
  login: ({ data = {} }) => {
    return instance.post("/user/login", data);
  },
};
