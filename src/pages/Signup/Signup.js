import React, { Component } from "react";
import { Switch, notification } from "antd";
import jwt from "jsonwebtoken";
import { withFormik } from "formik";
import * as Yup from "yup";

import { authServices } from "../../services/authServices";

import styles from "./Signup.module.scss";

const signupValidationSchema = Yup.object().shape({
  name: Yup.string().required("Name is required"),
  email: Yup.string().email("Email is not valid").required("Email is required"),
  password: Yup.string()
    .required("Password is required")
    .matches(
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/,
      "Must Contain 8 Characters, One Uppercase, One Lowercase, One Number and one special case Character"
    ),
  confirmPassword: Yup.string().oneOf(
    [Yup.ref("password"), null],
    "Passwords must match"
  ),
});

const loginValidationSchema = Yup.object().shape({
  email: Yup.string().email("Email is not valid").required("Email is required"),
  password: Yup.string().required("Password is required"),
});

const LoginForm = (props) => {
  const {
    values,
    touched,
    errors,
    handleChange,
    handleBlur,
    handleSubmit,
  } = props;
  return (
    <form onSubmit={handleSubmit} className={styles.inputs}>
      <input
        type="text"
        onChange={handleChange}
        onBlur={handleBlur}
        value={values.email}
        name="email"
        placeholder="Your Email ID"
      />
      {errors.email && touched.email ? (
        <div className={styles.error}>{errors.email}</div>
      ) : null}
      <input
        type="password"
        onChange={handleChange}
        onBlur={handleBlur}
        value={values.password}
        name="password"
        placeholder="Your Password"
      />
      {errors.password && touched.password ? (
        <div className={styles.error}>{errors.password}</div>
      ) : null}
      <button className={styles.submitButton} type="submit">
        {values.isSwitch ? "Sign in" : "Sign up"}
      </button>
    </form>
  );
};

const SignUpForm = (props) => {
  const {
    values,
    touched,
    errors,
    handleChange,
    handleBlur,
    handleSubmit,
  } = props;
  return (
    <form onSubmit={handleSubmit} className={styles.inputs}>
      {!values.isSwitchOn && (
        <input
          type="text"
          onBlur={handleBlur}
          onChange={handleChange}
          value={values.name}
          name="name"
          placeholder="John Doe"
        />
      )}
      {errors.name && touched.name ? (
        <div className={styles.error}>{errors.name}</div>
      ) : null}
      <input
        type="text"
        onChange={handleChange}
        onBlur={handleBlur}
        value={values.email}
        name="email"
        placeholder="johndeo@mail.co"
      />
      {errors.email && touched.email ? (
        <div className={styles.error}>{errors.email}</div>
      ) : null}
      <input
        type="password"
        onChange={handleChange}
        onBlur={handleBlur}
        value={values.password}
        name="password"
        placeholder="Password"
      />
      {errors.password && touched.password ? (
        <div className={styles.error}>{errors.password}</div>
      ) : null}
      {!values.isSwitchOn && (
        <input
          type="password"
          onChange={handleChange}
          onBlur={handleBlur}
          value={values.confirmPassword}
          name="confirmPassword"
          placeholder="Confirm Password"
        />
      )}
      {errors.confirmPassword && touched.confirmPassword ? (
        <div className={styles.error}>{errors.confirmPassword}</div>
      ) : null}
      <button className={styles.submitButton} type="submit">
        {values.isSwitch ? "Sign in" : "Sign up"}
      </button>
    </form>
  );
};

class Signup extends Component {
  state = { isSwitch: true };
  onSignup = async (values, { setSubmitting }) => {
    setSubmitting(false);
    try {
      let { email, password, name } = values;
      const data = { email, password, name };
      const res = await authServices.signup({ data });
      const token = res.data.token;
      await localStorage.setItem("token", res.data.token);
      const decodeToken = await jwt.decode(token);
      const { name: userName } = decodeToken;
      notification["success"]({
        message: `Welcome ${userName}`,
        description: "",
      });
      this.props.onAuth(true);
    } catch (err) {
      notification["error"]({
        message: "Signup Failed",
        description: err.response.data.error,
      });
    }
  };
  onLogin = async (values, { setSubmitting }) => {
    setSubmitting(false);
    try {
      let { email, password } = values;
      const data = { email, password };
      const res = await authServices.login({ data });
      const token = res.data.token;
      await localStorage.setItem("token", res.data.token);
      const decodeToken = await jwt.decode(token);
      const { name } = decodeToken;
      notification["success"]({
        message: `Welcome ${name}`,
        description: "",
      });
      this.props.onAuth(true);
    } catch (err) {
      notification["error"]({
        message: "Login Failed",
        description: err.response.data.error,
      });
    }
  };

  SignUpFormWrapper = withFormik({
    mapPropsToValues: () => ({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      isSwitch: this.state.isSwitch,
    }),
    validationSchema: signupValidationSchema,
    handleSubmit: this.onSignup,
    displayName: "AuthenticationForm",
  })(SignUpForm);

  LoginFormWrapper = withFormik({
    mapPropsToValues: () => ({
      email: "",
      password: "",
      isSwitch: this.state.isSwitch,
    }),
    validationSchema: loginValidationSchema,
    handleSubmit: this.onLogin,
    displayName: "AuthenticationForm",
  })(LoginForm);

  handleSwitch = (value) => {
    this.setState({ isSwitch: value });
  };

  render() {
    const { isSwitch } = this.state;
    return (
      <div className={styles.container}>
        <div className={styles.wrapper}>
          <h5 className={styles.header}>
            Account {isSwitch ? "Sign in" : "Sign up"}
          </h5>
          {isSwitch ? <this.LoginFormWrapper /> : <this.SignUpFormWrapper />}
          <div className={styles.switchContainer}>
            <span>Switch to {!isSwitch ? "Sign in" : "Sign up"}</span>
            <Switch checked={isSwitch} onChange={this.handleSwitch} />
          </div>
        </div>
      </div>
    );
  }
}

export default Signup;
