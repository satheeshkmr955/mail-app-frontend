import React, { Component } from "react";
import {
  Layout,
  Menu,
  Avatar,
  Dropdown,
  notification,
  Modal,
  Table,
  Button,
  Input,
  Select,
  Upload,
} from "antd";
import { UserOutlined, PlusOutlined, UploadOutlined } from "@ant-design/icons";
import moment from "moment";
import io from "socket.io-client";
import fileDownload from "js-file-download";

import "./antd.css";
import styles from "./Layout.module.scss";

import { MAIL_LIST } from "./constants";
import { APIServices } from "../../services/apiServices.js";

const socket = io.connect(process.env.REACT_APP_SOCKET_HOST);

const { Header, Sider, Content } = Layout;
const { TextArea } = Input;
const { Option } = Select;
const classNames = require("classnames");

const menuItem = [
  { title: "Inbox", fontIcon: "fas fa-inbox", status: "SEND" },
  { title: "Draft", fontIcon: "fas fa-save", status: "DRAFT" },
  { title: "Sent", fontIcon: "fas fa-paper-plane", status: "SEND" },
];

const resetState = {
  loading: true,
  visible: false,
  emailOptions: [],
  emailValue: [],
  uploadFile: [],
  form: { email: [], subject: "", message: "", attachment: [] },
};

class LayoutComponent extends Component {
  state = {
    collapsed: false,
    mailType: "inbox",
    mails: [],
    status: "SEND",
    loading: true,
    visible: false,
    emailOptions: [],
    emailValue: [],
    uploadFile: [],
    form: { email: [], subject: "", message: "", attachment: [] },
  };

  componentDidMount = async () => {
    this.notifyServer();
    this.getMails({ mailType: "inbox" });
  };

  notifyServer = async () => {
    try {
      const {
        userDetails: { id },
      } = this.props;
      socket.on("inbox", (data) => {
        this.getMails({ mailType: "inbox" });
        notification["success"]({
          message: `New Message Received`,
          description: `${data.name} has mail you regarding ${data.subject}`,
        });
      });
      socket.emit("updateDetails", { id });
    } catch (err) {
      console.log(err);
    }
  };

  getMails = async ({ mailType = "inbox", status = this.state.status }) => {
    this.setState({ loading: true });
    try {
      const params = { mailType };
      if (status) params.status = status;
      const res = await APIServices.getMessages({ params });
      const mails = res.data.data.map((obj) => {
        let name = "";
        if (mailType === "inbox") {
          name = obj.senderId.name;
        }
        if (obj.receiverId.length > 0 && obj.receiverId[0].name) {
          name = obj.receiverId[0].name;
        }
        const deleteIcon = (
          <div
            className={styles.deleteIcon}
            onClick={() => {
              this.handleDeleteMessage(obj);
            }}
          >
            <i className="fas fa-trash "></i>
          </div>
        );
        const downloadButton =
          obj.attachment.length > 0 ? (
            <Button
              type="primary"
              shape="round"
              icon={<i className="fas fa-download"></i>}
              size={"small"}
              onClick={() => {
                this.handleFileDownload(obj);
              }}
            >
              &nbsp;&nbsp;Download
            </Button>
          ) : (
            "No Attachments"
          );
        return {
          ...obj,
          name: name,
          deleteIcon,
          downloadButton,
          createdAt: moment(obj.createdAt)
            .local()
            .format("YYYY-MM-DD ddd hh:mm:ss A"),
        };
      });
      this.setState({ loading: false, mails, mailType, status });
    } catch (err) {
      console.log(err);
    }
  };

  handleOpen = () => {
    this.setState({ visible: true });
  };

  handleFileDownload = async (obj) => {
    try {
      const file = await APIServices.getFile({ id: obj.attachment[0]._id });
      notification["success"]({
        message: `Downloaded`,
        description: "",
      });
      fileDownload(
        Buffer.from(file.data, "base64"),
        `attachment.${obj.attachment[0].filesDetails.filename.split(".")[1]}`
      );
    } catch (err) {
      console.log(err);
      notification["error"]({
        message: "Error while Downloading",
        description: err.response.data.error,
      });
    }
  };

  handleDeleteMessage = async (obj) => {
    try {
      const { mailType, status } = this.state;
      await APIServices.deleteMessage({ id: obj._id });
      notification["success"]({
        message: `Delete Success`,
        description: "",
      });
      this.getMails({ mailType, status });
    } catch (err) {
      console.log(err);
      notification["error"]({
        message: "Delete Failed",
        description: err.response.data.error,
      });
    }
  };

  handleOk = async () => {
    this.setState({ loading: true });
    try {
      const { form, mailType, status } = this.state;
      const { email } = form;
      if (email.length === 0) {
        notification["error"]({
          message: "Mail ID is required",
          description: "",
        });
        this.setState({ ...resetState });
        return;
      }
      const data = {
        ...form,
        receiverId: email,
        status: "send",
      };
      await APIServices.createMessage({ data });
      notification["success"]({
        message: `Mail Sent`,
        description: "",
      });
      this.setState({ ...resetState });
      this.getMails({ mailType, status });
    } catch (err) {
      notification["error"]({
        message: "Sent Failed",
        description: err.response.data.error,
      });
      this.setState({ ...resetState });
    }
  };

  handleCancel = async () => {
    this.setState({ loading: true });
    try {
      const { form, mailType, status } = this.state;
      const { email } = form;
      const data = { ...form, receiverId: email, status: "draft" };
      await APIServices.createMessage({ data });
      notification["success"]({
        message: `Saved as Draft`,
        description: "",
      });
      this.setState({ ...resetState });
      this.getMails({ mailType, status });
    } catch (err) {
      notification["error"]({
        message: "Draft Failed",
        description: err.response.data.error,
      });
      this.setState({ ...resetState });
    }
  };

  handleEmailSearch = async (value) => {
    try {
      const params = { email: value, regex: `["email"]` };
      const res = await APIServices.getUserList({ params });
      const options = res.data.data.map((obj) => {
        return { ...obj, label: obj.email, value: obj._id };
      });
      this.setState({ emailOptions: options });
    } catch (err) {
      console.log(err);
    }
  };

  handleEmailChange = async (value) => {
    try {
      const id = value.map((obj) => obj.value);
      this.setState((prevState) => {
        return {
          ...prevState,
          form: { ...prevState.form, email: id },
          emailValue: value,
        };
      });
    } catch (err) {
      console.log(err);
    }
  };

  handleInputChange = async ({ key, value }) => {
    this.setState((prevState) => {
      return { ...prevState, form: { ...prevState.form, [key]: value } };
    });
  };

  handleLogout = async () => {
    await localStorage.setItem("token", null);
    this.props.onAuth(false);
  };

  onCollapse = (collapsed) => {
    this.setState({ collapsed });
  };

  menuList = (
    <Menu>
      <Menu.Item key="0" onClick={this.handleLogout}>
        Logout
      </Menu.Item>
    </Menu>
  );

  render() {
    const {
      collapsed,
      mails,
      loading,
      visible,
      emailOptions,
      form,
      emailValue,
    } = this.state;
    const {
      userDetails: { name, token },
    } = this.props;

    const handleFileUpload = {
      name: "file",
      action: process.env.REACT_APP_API_SERVER + "/v1/upload",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      onChange: (info) => {
        if (info.file.status !== "uploading") {
          const fileId = info.fileList.map((obj) => obj.response.data._id);
          this.setState((prevState) => {
            return {
              ...prevState,
              form: { ...prevState.form, attachment: fileId },
              uploadFile: info.fileList,
            };
          });
        }
        if (info.file.status === "done") {
          notification["success"]({
            message: `Upload Success`,
            description: `${info.file.name} file uploaded successfully`,
          });
        } else if (info.file.status === "error") {
          notification["error"]({
            message: `Upload Failed`,
            description: `${info.file.name} file upload failed.`,
          });
        }
      },
    };

    return (
      <Layout className={styles.container}>
        <Header className={styles.header}>
          <div className={styles.logo} />
          <Dropdown overlay={this.menuList} trigger={["click"]}>
            <Avatar
              size={34}
              style={{
                backgroundColor: "#7265e6",
                verticalAlign: "middle",
                cursor: "pointer",
              }}
            >
              {name ? name[0].toUpperCase() : <UserOutlined />}
            </Avatar>
          </Dropdown>
        </Header>
        <Layout>
          <Sider
            collapsible
            collapsed={collapsed}
            onCollapse={this.onCollapse}
            className={styles.sidebar}
          >
            <Menu
              theme="dark"
              defaultSelectedKeys={[`Inbox${collapsed}`]}
              mode="inline"
            >
              <Button
                type="primary"
                shape="round"
                icon={<PlusOutlined />}
                size={"large"}
                style={{ marginBottom: "5px" }}
                onClick={this.handleOpen}
              >
                {collapsed ? "" : "Compose"}
              </Button>
              <Modal
                visible={visible}
                title="Compose Mails"
                onOk={this.handleOk}
                onCancel={this.handleCancel}
                footer={[
                  <Button key="back" onClick={this.handleCancel}>
                    Draft
                  </Button>,
                  <Button
                    key="submit"
                    type="primary"
                    loading={loading}
                    onClick={this.handleOk}
                  >
                    Send
                  </Button>,
                ]}
              >
                <label htmlFor="">To</label>
                <div>
                  <Select
                    showSearch
                    mode="tags"
                    labelInValue
                    style={{ width: "100%" }}
                    onChange={this.handleEmailChange}
                    onSearch={this.handleEmailSearch}
                    filterOption={(inputValue, option) =>
                      option.children
                        .toString()
                        .toLowerCase()
                        .includes(inputValue.toLowerCase())
                    }
                    value={emailValue}
                  >
                    {emailOptions.map((option) => (
                      <Option key={option._id} value={option._id}>
                        {option.email}
                      </Option>
                    ))}
                  </Select>
                </div>
                <label htmlFor="">Subject</label>
                <Input
                  value={form.subject}
                  onChange={(e) => {
                    this.handleInputChange({
                      key: "subject",
                      value: e.target.value,
                    });
                  }}
                />
                <label htmlFor="">Message</label>
                <TextArea
                  rows={4}
                  value={form.message}
                  onChange={(e) => {
                    this.handleInputChange({
                      key: "message",
                      value: e.target.value,
                    });
                  }}
                />
                <div className={styles.uploadPos} key={visible}>
                  <Upload {...handleFileUpload}>
                    <Button>
                      <UploadOutlined /> Click to Upload
                    </Button>
                  </Upload>
                </div>
              </Modal>
              {menuItem.map((obj) => {
                return (
                  <Menu.Item
                    key={`${obj.title}${collapsed}`}
                    onClick={() => {
                      this.getMails({
                        mailType: obj.title.toLowerCase(),
                        status: obj.status ? obj.status.toUpperCase() : null,
                      });
                    }}
                  >
                    <i
                      className={classNames([
                        obj.fontIcon,
                        styles.fontIcon,
                        { [styles["fontIconLg"]]: collapsed },
                      ])}
                    ></i>
                    <span>{collapsed ? "" : obj.title}</span>
                  </Menu.Item>
                );
              })}
            </Menu>
          </Sider>
          <Content className={styles.content}>
            <Table
              rowKey={(obj) => obj._id}
              loading={loading}
              className={styles.tableContainer}
              pagination={{ position: "top" }}
              dataSource={mails}
              columns={MAIL_LIST.Columns}
            />
          </Content>
        </Layout>
        {/* <Footer style={{ textAlign: "center" }}>
          Ant Design ©2016 Created by Ant UED
        </Footer> */}
      </Layout>
    );
  }
}

export default LayoutComponent;
