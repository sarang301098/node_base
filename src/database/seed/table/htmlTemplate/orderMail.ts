import config from '../../../../config';
export const order = (status: string): string => {
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
                                                      <img src="https://service-pb-s3.s3.ap-south-1.amazonaws.com/propane-brothers-app/logo-big.png" alt="logo" download="false" style="height: 110px;" />
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
                                                      <span style="font-size: 18px; display: block;">Hi {name},</span>
                                                      <p style="margin-top: 5px;">Thank you for choosing Propane Brothers. </p>
                                                      <p style="margin-bottom: 0px;">Your order has been ${status} successfully. </p>
                                                  </td>
                                              </tr>
                                              <tr>
                                                  <td style="padding: 10px 30px 20px 30px;" colspan="3">
                                                      <p style="border-top: 1px solid #ecf4fd; margin: 0px;"></p>
                                                      <p style="margin-bottom: 0px;">Here's a summary of your order : </p>
                                                  </td>
                                              </tr>
                                              <tr>
                                                  <td style="padding: 0px 30px;" colspan="3">
                                                      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="font-size:14px; color: #263b5f; font-family: Verdana, Arial,Helvetica,sans-serif; line-height: 1.5; border-collapse: collapse; margin-bottom: 10px;">
                                                          <tbody>
                                                              <tr style="background-color: #EEF0F3;">
                                                                  <td style="border: 1px solid #E5E7EB; padding: 9px 12px; width: 155px;">Order ID</td>
                                                                  <td style="border: 1px solid #E5E7EB; padding: 9px 12px;">{invoiceNumber}</td>
                                                              </tr>
                                                              <tr>
                                                                  <td style="border: 1px solid #E5E7EB; padding: 9px 12px; width: 155px;">Delivery Address</td>
                                                                  <td style="border: 1px solid #E5E7EB; padding: 9px 12px;">{address}</td>
                                                              </tr>
                                                              <tr style="background-color: #EEF0F3;">
                                                                  <td style="border: 1px solid #E5E7EB; padding: 9px 12px; width: 155px;">Order Quantity</td>
                                                                  <td style="border: 1px solid #E5E7EB; padding: 9px 12px;">{qty}</td>
                                                              </tr>
                                                              <tr>
                                                                  <td style="border: 1px solid #E5E7EB; padding: 9px 12px; width: 155px;">Delivery Fee</td>
                                                                  <td style="border: 1px solid #E5E7EB; padding: 9px 12px;">{deliverFee}</td>
                                                              </tr>
                                                              <tr style="background-color: #EEF0F3;">
                                                                  <td style="border: 1px solid #E5E7EB; padding: 9px 12px; width: 155px;">Sales Tax 7%</td>
                                                                  <td style="border: 1px solid #E5E7EB; padding: 9px 12px;">{salesTax}</td>
                                                              </tr>
                                                              <tr>
                                                                  <td style="border: 1px solid #E5E7EB; padding: 9px 12px; width: 155px;">Service Fee</td>
                                                                  <td style="border: 1px solid #E5E7EB; padding: 9px 12px;">{serviceFee}</td>
                                                              </tr>
                                                              <tr style="background-color: #EEF0F3;">
                                                                  <td style="border: 1px solid #E5E7EB; padding: 9px 12px; width: 155px;">Service Charge</td>
                                                                  <td style="border: 1px solid #E5E7EB; padding: 9px 12px;">{serviceCharge}</td>
                                                              </tr>
                                                              <tr>
                                                                  <td style="border: 1px solid #E5E7EB; padding: 9px 12px; width: 155px;">Promocode</td>
                                                                  <td style="border: 1px solid #E5E7EB; padding: 9px 12px;">{promocode}</td>
                                                              </tr>
                                                              <tr style="background-color: #EEF0F3;">
                                                                  <td style="border: 1px solid #E5E7EB; padding: 9px 12px; width: 155px;">Promocode Discount</td>
                                                                  <td style="border: 1px solid #E5E7EB; padding: 9px 12px;">{promocodeDiscount}</td>
                                                              </tr>
                                                              <tr>
                                                                  <td style="border: 1px solid #E5E7EB; padding: 9px 12px; width: 155px;">Total</td>
                                                                  <td style="border: 1px solid #E5E7EB; padding: 9px 12px; font-size: 20px; font-weight: 700;">
                                                                      {total}
                                                                  </td>
                                                              </tr>
                                                          </tbody>
                                                      </table>
                                                  </td>
                                              </tr>
                                              <tr>
                                                  <td style="padding: 20px 30px;" colspan="3">
                                                      <p style="border-bottom: 1px solid #ecf4fd; margin: 0px;"></p>
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
                                                      <p style="margin-top: 0px;"> Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's.</p>
                                                      <a href="javascript:;" target="_blank"> <img src="${config.SERVER_URL}/img/app-store.png" alt="App Store" /></a>
                                                      <a href="javascript:;" target="_blank"> <img src="${config.SERVER_URL}/img/play-store.png" alt="Play Store" /></a>
                                                  </td>
                                              </tr>
                                              <tr>
                                                  <td style="padding: 20px 30px;">
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
