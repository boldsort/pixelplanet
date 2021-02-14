/*
 * Change Mail Form
 * @flow
 */

import React from 'react';
import { t } from 'ttag';
import {
  validateEMail, validatePassword, parseAPIresponse,
} from '../utils/validation';

function validate(email, password) {
  const errors = [];

  const passerror = validatePassword(password);
  if (passerror) errors.push(passerror);
  const mailerror = validateEMail(email);
  if (mailerror) errors.push(mailerror);

  return errors;
}

async function submitMailchange(email, password) {
  const body = JSON.stringify({
    email,
    password,
  });
  const response = await fetch('./api/auth/change_mail', {
    method: 'POST',
    headers: {
      'Content-type': 'application/json',
    },
    body,
    credentials: 'include',
  });

  return parseAPIresponse(response);
}

class ChangeMail extends React.Component {
  constructor() {
    super();
    this.state = {
      password: '',
      email: '',
      submitting: false,
      success: false,

      errors: [],
    };

    this.handleSubmit = this.handleSubmit.bind(this);
  }

  async handleSubmit(e) {
    e.preventDefault();

    const { email, password, submitting } = this.state;
    if (submitting) return;

    const errors = validate(email, password);

    this.setState({ errors });
    if (errors.length > 0) return;
    this.setState({ submitting: true });

    const { errors: resperrors } = await submitMailchange(email, password);
    if (resperrors) {
      this.setState({
        errors: resperrors,
        submitting: false,
      });
      return;
    }
    this.setState({
      success: true,
    });
  }

  render() {
    const { success } = this.state;
    const { done } = this.props;
    if (success) {
      return (
        <div className="inarea">
          <p
            className="modalmessage"
          >
            {t`Changed Mail successfully. We sent you a verification mail, \
              please verify your new mail address.`}
          </p>
          <button type="button" onClick={done}>Close</button>
        </div>
      );
    }
    const {
      errors, password, email, submitting,
    } = this.state;
    return (
      <div className="inarea">
        <form onSubmit={this.handleSubmit}>
          {errors.map((error) => (
            <p key={error} className="errormessage">
              <span>{t`Error`}</span>:&nbsp;
              {error}
            </p>
          ))}
          <input
            value={password}
            onChange={(evt) => this.setState({ password: evt.target.value })}
            type="password"
            placeholder={t`Password`}
          />
          <br />
          <input
            value={email}
            onChange={(evt) => this.setState({ email: evt.target.value })}
            type="text"
            placeholder={t`New Mail`}
          />
          <br />
          <button type="submit">
            {(submitting) ? '...' : t`Save`}
          </button>
          <button type="button" onClick={done}>{t`Cancel`}</button>
        </form>
      </div>
    );
  }
}

export default ChangeMail;
