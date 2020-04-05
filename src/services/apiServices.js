import axios from "axios";

axios.interceptors.request.use(
  async (config) => {
    const token = await localStorage.getItem("token");
    config.headers.common["Authorization"] = `Bearer ${token}`;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const APIServices = {
  updateUserDetails: ({ data = {} }) => {
    return axios.patch(`/v1/user/update`, data);
  },
  getUserList: ({ params = {} }) => {
    return axios.get(`/v1/user`, { params });
  },
  createMessage: ({ data = {} }) => {
    return axios.post(`/v1/message`, data);
  },
  getMessages: ({ params = {} }) => {
    return axios.get(`/v1/message`, { params });
  },
  getMessage: ({ id = "" }) => {
    return axios.get(`/v1/message/${id}`);
  },
  deleteMessage: ({ id = "" }) => {
    return axios.delete(`/v1/message/${id}`);
  },
  uploadFile: ({ data }) => {
    return axios.post(`/v1/upload`, data);
  },
  getFile: ({ id }) => {
    return axios.get(`/v1/upload/${id}`, { responseType: "arraybuffer" });
  },
};
