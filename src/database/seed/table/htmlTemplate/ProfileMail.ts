import config from '../../../../config';

export const profile = (message: string): string => {
  return `<body style="margin: 0px; padding: 0px; background-color: #f9f9f9;">
<table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#f9f9f9">
    <tbody>
        <tr>
            <td align="top">
                <div align="center">
                    <table width="620" style="margin: 30px 0px;"  cellspacing="0" cellpadding="0" bgcolor="#fff">
                        <tbody>
                            <tr>
                                <td style="padding: 25px 30px;">
                                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background: #fff; font-family: Verdana, Arial,Helvetica,sans-serif; line-height: 1;">
                                        <tbody>
                                            <tr>
                                                <td valign="middle" align="center" style="padding: 0px;">
                                                <img src="" alt="logo" download="false" style="height: 110px;" />
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding-top: 25px;">
                                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="font-size:14px; color: #263b5f; font-family: Verdana, Arial,Helvetica,sans-serif; line-height: 1.5;">
                                        <tbody>
                                            <tr>
                                                <td style="padding: 0px 30px 10px 30px;" colspan="3">
                                                    <span style="font-size: 18px; display: block;">Dear {name},</span>
                                                    <p style="margin-top: 5px;">${message}</p>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="font-size:14px; color: #263b5f; font-family: Verdana, Arial,Helvetica,sans-serif; line-height: 1.5;">
                                        <tbody>
                                            <tr>
                                                <td style="padding: 0px 30px;">
                                                <a href="javascript:;" target="_blank"><img src="${config.SERVER_URL}/img/app-store.png" alt="App Store" /></a>
                                                <a href="javascript:;" target="_blank"><img src="${config.SERVER_URL}/img/play-store.png" alt="Play Store" /></a>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 15px 30px 20px;">
                                                    If you have any questions or concerns, we're here to help. Contact us at <br />
                                                    <a href="mailto:admin@propane-bros.com" style="color: #656363;">{admin}</a>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 0px 30px;">
                                                    Thank you, <br /> Propane Brothers
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="font-size: 12px; font-style: italic; color: #6c757d; padding: 20px 30px; border-radius: 0px 0px 4px 4px;">
                                                    <strong>Note:</strong> The content of this email is intended only for use by the individual or entity to whom it is addressed.
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="font-size:14px; color: #263b5f; font-family: Verdana, Arial,Helvetica,sans-serif; line-height: 1.5;">
                                        <tbody>
                                            <tr>
                                                <td style="padding: 0px 30px; vertical-align: top; background: #f9f9f9; color: #898f95; text-align: center;"><p style="font-size: 14px; padding-top: 15px; margin-bottom: 8px; margin-top: 0px; border-top: 1px solid #ecf4fd;">&copy; Copyright 2021-22 by Propane Brothers. All Rights Reserved.</p>
                                                    <small>Please do not reply to this message; it was sent from an unmonitored email address.</small> <br />
                                                    <small>This message is a service email related to your use of Propane Brothers.</small>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </td>
        </tr>
    </tbody>
</table>
</body>`;
};
