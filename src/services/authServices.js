import axios from "axios";

const instance = axios.create({
  baseURL: process.env.REACT_APP_API_SERVER + "/v1",
});

export const authServices = {
  signup: ({ data = {} }) => {
    return instance.post("/user/signup", data);
  },
  login: ({ data = {} }) => {
    return instance.post("/user/login", data);
  },
};
