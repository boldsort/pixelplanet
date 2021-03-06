/*
 * Form for requesting password-reset mail
 * @flow
 */
import React from 'react';
import { validateEMail, parseAPIresponse } from '../utils/validation';

function validate(email) {
  const errors = [];
  const mailerror = validateEMail(email);
  if (mailerror) errors.push(mailerror);
  return errors;
}

async function submitNewpass(email) {
  const body = JSON.stringify({
    email,
  });
  const response = await fetch('./api/auth/restore_password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body,
  });

  return parseAPIresponse(response);
}

const inputStyles = {
  display: 'inline-block',
  width: '100%',
  maxWidth: '35em',
};

class NewPasswordForm extends React.Component {
  constructor() {
    super();
    this.state = {
      email: '',
      submitting: false,
      success: false,

      errors: [],
    };

    this.handleSubmit = this.handleSubmit.bind(this);
  }

  async handleSubmit(e) {
    e.preventDefault();

    const { email, submitting } = this.state;
    if (submitting) return;

    const errors = validate(email);

    this.setState({ errors });
    if (errors.length > 0) return;

    this.setState({ submitting: true });
    const { errors: resperrors } = await submitNewpass(email);
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
    const { back } = this.props;
    if (success) {
      return (
        <div>
          <p className="modalmessage">
            Sent you a mail with instructions to reset your password.
          </p>
          <button type="button" onClick={back}>Back</button>
        </div>
      );
    }
    const { errors, email, submitting } = this.state;
    return (
      <form onSubmit={this.handleSubmit}>
        {errors.map((error) => (
          <p key={error}>Error: {error}</p>
        ))}
        <input
          style={inputStyles}
          value={email}
          onChange={(evt) => this.setState({ email: evt.target.value })}
          type="text"
          placeholder="Email"
        />
        <br />
        <button type="submit">
          {(submitting) ? '...' : 'Submit'}
        </button>
        <button type="button" onClick={back}>Cancel</button>
      </form>
    );
  }
}

export default NewPasswordForm;
