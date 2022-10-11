import { getManager } from 'typeorm';
import _, { sumBy } from 'lodash';
import moment from 'moment';
import { Cart } from '../model/Cart';
import { Appsettings } from '../model/Appsettings';
import { OrderDetails } from '../model/OrderDetails';
import { VendorSchedule } from '../model/VendorSchedule';
// import { CartRepository } from '../repository/Cart';
interface Request {
  userId?: string;
  isOrder?: boolean;
  promocodeId?: number;
  promocodeAppliedCartId?: number;
  checkForleakage?: boolean;
}
interface ICartResponse {
  count?: number;
  subTotal?: number;
  serviceFee?: number;
  leakageFee?: number;
  grandTotal?: number;
  deliveryFee?: number;
  serviceCharge?: number;
  locationAmount: number;
  salesTaxAmount?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cartDetails?: Array<any>;
  promocodeDiscount?: number;
}
interface IOrderResponse {
  count?: number;
  subTotal?: number;
  serviceFee?: number;
  leakageFee?: number;
  grandTotal?: number;
  deliveryFee?: number;
  serviceCharge?: number;
  locationAmount: number;
  salesTaxAmount?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  orderDetails?: Array<any>;
  promocodeDiscount?: number;
}
interface Response {
  count?: number;
  subTotal?: number;
  cartData?: Array<Cart>;
  grandTotal?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  orderDetails?: Array<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cartDetails?: Array<any>;
  promocodeDiscount?: number;
  deliveryFee?: number;
  salesTaxAmount?: number;
  serviceFee?: number;
  serviceCharge?: number;
  locationAmount?: number;
  leakageFee?: number;
  orderCartResponse?: ICartResponse;
}
class GetCartService {
  private static instance: GetCartService;
  constructor() {
    if (GetCartService.instance instanceof GetCartService) {
      return GetCartService.instance;
    }
    GetCartService.instance = this;
  }

  public async execute(request: Request): Promise<Response> {
    const query = this.prepareQuery(request);
    const cartData = await query.getMany();
    return request?.isOrder
      ? this.prepareOrderResponse(cartData, cartData.length, request?.checkForleakage)
      : this.prepareCartResponse(cartData, cartData.length, request?.checkForleakage);
  }

  private prepareQuery(request: Request) {
    const query = getManager()
      .createQueryBuilder(Cart, 'cart')
      .leftJoin('cart.user', 'user', 'user.id = :userId', { userId: request?.userId })
      .where('cart.isActive = :isActive', { isActive: true })
      .leftJoinAndSelect('cart.zipcode', 'zipCode')
      .leftJoin('cart.vendor', 'vendor')
      .addSelect(['vendor.id', 'vendor.fullName', 'vendor.email', 'vendor.stripeAccountId'])
      .leftJoin('vendor.vendor', 'vendorDetails')
      .addSelect(['vendorDetails.id', 'vendorDetails.comissionFee', 'vendorDetails.leakageFee'])
      .leftJoin('cart.product', 'product')
      .addSelect(['product.id', 'product.logo', 'product.name'])
      .leftJoin('product.details', 'productDetails')
      .addSelect(['productDetails.id', 'productDetails.indexPrice', 'productDetails.discount'])
      .leftJoin('cart.category', 'category')
      .addSelect(['category.id', 'category.name', 'category.orderType'])
      .leftJoin('cart.accessory', 'accessory')
      .addSelect([
        'accessory.id',
        'accessory.name',
        'accessory.image',
        'accessory.price',
        'accessory.description',
      ])
      .leftJoin('cart.cylindersize', 'cylindersize')
      .addSelect(['cylindersize.id', 'cylindersize.cylinderSize'])
      .leftJoin(
        'cart.promocode',
        'promocode',
        'promocode.isActive = :isActive AND promocode.startAt <= CURRENT_TIMESTAMP() AND promocode.endAt >= CURRENT_TIMESTAMP() AND FIND_IN_SET(:userId, promocode.customerIds)',
        { userId: request?.userId, isActive: true },
      )
      .addSelect(['promocode.id', 'promocode.discount', 'promocode.promocode'])
      .leftJoin('cart.timeslot', 'timeslot')
      .addSelect(['timeslot.id', 'timeslot.startTime', 'timeslot.endTime'])
      .leftJoin('cart.location', 'location')
      .addSelect(['location.id', 'location.name', 'location.price', 'location.description'])
      .leftJoinAndSelect(
        'product.vendorProducts',
        'vendorProducts',
        'vendorProducts.vendor_id = vendor.id',
      )
      .leftJoin(
        'vendorProducts.tiers',
        'vendorProductTiers',
        'cart.qty BETWEEN vendorProductTiers.from AND vendorProductTiers.to',
      )
      .addSelect(['vendorProductTiers.id', 'vendorProductTiers.from', 'vendorProductTiers.to'])
      .leftJoinAndSelect(
        'vendorProductTiers.pricing',
        'vendorProductPricing',
        'vendorProductPricing.vendor_product_id = vendorProducts.id AND vendorProductPricing.vendor_product_tiers_id = vendorProductTiers.id AND IF(category.id IS NOT NULL, vendorProductPricing.category_id  = category.id, true) AND IF(cylindersize.id IS NOT NULL, vendorProductPricing.cylinder_size_id = cylindersize.id, true)',
      )
      .leftJoin('productDetails.category', 'productCategory', 'category.id = productCategory.id')
      .addSelect(['productCategory.id', 'productCategory.name', 'productCategory.orderType']);
    return query;
  }

  private async getGeneralCharges() {
    const generalCharges = await getManager()
      .getRepository(Appsettings)
      .find({ where: { isActive: true } });
    return generalCharges;
  }

  private getSubTotal(
    // vendorPrice: number,
    productPrice: number,
    accessoryPrice: number,
    quantity: number,
  ) {
    return (productPrice + accessoryPrice) * quantity;
  }

  private calculateGrandTotal(
    subTotal: number,
    locationPrice: number,
    timeSlotPrice: number,
    promocodeDiscount: number,
    vendorDeliveryFee: number,
    salesTaxAmount: number,
    leakageFee: number,
    serviceFee: number,
    serviceCharge: number,
    deliveryFees: number,
  ) {
    return (
      subTotal +
      serviceFee +
      serviceCharge +
      deliveryFees +
      locationPrice +
      timeSlotPrice -
      promocodeDiscount +
      vendorDeliveryFee +
      salesTaxAmount +
      leakageFee
    );
  }

  // private async checkPromocode(
  //   userId: string,
  //   promocodeId: number | undefined,
  //   promocodeAppliedCartId: number | undefined,
  //   categoryId: number | undefined,
  //   productId: number | undefined,
  // ) {
  //   const cartRepository = getCustomRepository(CartRepository);
  //   const query = getManager()
  //     .createQueryBuilder(PromoCodes, 'promocode')
  //     .where('promocode.id = :promocodeId', { promocodeId })
  //     .andWhere('promocode.isActive = :isActive', { isActive: true })
  //     .andWhere(
  //       'promocode.startAt <= CURRENT_TIMESTAMP() AND promocode.endAt >= CURRENT_TIMESTAMP()',
  //     )
  //     .andWhere('FIND_IN_SET(:userId, promocode.customerIds)', { userId })
  //     .innerJoinAndSelect('promocode.product', 'product', 'product.id = :productId', { productId });
  //   if (categoryId) {
  //     query.andWhere('FIND_IN_SET(:categoryId, promocode.categoryIds)', { categoryId });
  //   }
  //   const promocodeData = await query.getOne();
  //   const cart = await cartRepository.findOne({
  //     where: { id: promocodeAppliedCartId },
  //   });
  //   if (promocodeData && cart) return true;
  //   return false;
  // }
  private async getCartDetail(cartData: Cart[], checkForleakage: boolean) {
    // general charges from App settings.
    const generalCharges = await this.getGeneralCharges();
    const serviceFee =
      ((generalCharges || []).find((charge) => charge.key === 'service_fee') || {}).value || 0;
    const serviceCharge =
      ((generalCharges || []).find((charge) => charge.key === 'service_charge') || {}).value || 0;
    const deliveryFees =
      ((generalCharges || []).find((charge) => charge.key === 'delivery_fee') || {}).value || 0;

    const cartDetails = (cartData || []).map((cart) => {
      const productDetails = (cart?.product?.details || []).find(
        (detail) => detail?.category?.id === cart?.category?.id,
      );
      const productPrice =
        ((productDetails?.indexPrice || 0) * (100 - (productDetails?.discount || 0))) / 100;
      const subTotal = this.getSubTotal(
        productPrice || 0,
        cart?.accessory?.price || 0,
        cart?.qty || 0,
      );
      const isSalesTax =
        (cart?.product?.vendorProducts &&
          Array.isArray(cart?.product?.vendorProducts) &&
          cart?.product?.vendorProducts[0]?.isSalesTax) ||
        0; // TODO: isOrder
      const salesTaxAmount = isSalesTax ? ((cart?.zipcode?.salesTax || 0) * subTotal) / 100 : 0;

      let vendorDeliveryFee = 0;
      if (cart.qty && cart?.product?.vendorProducts[0]?.tiers[0]?.pricing[0]?.price)
        vendorDeliveryFee = cart?.product?.vendorProducts[0]?.tiers[0]?.pricing[0]?.price;

      // let promocodeDiscountPercentage;
      // let promocodeDiscountAmount;
      // const checkPromo = this.checkPromocode(
      //   request?.userId || '',
      //   request?.promocodeId,
      //   request?.promocodeAppliedCartId,
      //   cart?.categoryId,
      //   cart?.productId,
      // );
      // if (checkPromo) {
      // const promocodeDiscountPercentage =
      //   cart?.id === request?.promocodeAppliedCartId ? promocode?.discount : 0;
      // const promocodeDiscountAmount = (Number(promocodeDiscountPercentage || 0) / 100) * subTotal;
      // }
      const promocodeDiscountPercentage =
        cart?.promocode && cart?.promocode?.discount ? cart?.promocode?.discount : 0;
      const promocodeDiscountAmount = (Number(promocodeDiscountPercentage || 0) / 100) * subTotal;
      // checking for the vendor schedules
      this.checkVendorSchedule(cart?.timeslot?.id, cart?.vendorId, cart?.scheduleDate);

      const grandTotal = this.calculateGrandTotal(
        subTotal,
        cart?.location?.price || 0,
        0,
        promocodeDiscountAmount || 0,
        vendorDeliveryFee,
        salesTaxAmount,
        checkForleakage ? +cart?.vendor?.vendor?.leakageFee || 0 : 0,
        Number((serviceFee / cartData.length).toFixed(2)),
        Number((serviceCharge / cartData.length).toFixed(2)),
        Number((deliveryFees / cartData.length).toFixed(2)),
      );
      // charges according to the appsettings.
      const freelanceDriverReceivedAmount =
        (
          (generalCharges || []).find(
            (charge) =>
              charge.key === 'freelance_driver_price' && charge.orderType === cart?.orderType,
          ) || {}
        ).value || 0;
      const customerCancellationCharge =
        (
          (generalCharges || []).find(
            (charge) =>
              charge.key === 'cancellation_charge_customer' && charge.orderType === cart?.orderType,
          ) || {}
        ).value || 0;
      const driverCancellationCharge =
        (
          (generalCharges || []).find(
            (charge) =>
              charge.key === 'cancellation_charge_driver' && charge.orderType === cart?.orderType,
          ) || {}
        ).value || 0;

      return {
        subTotal,
        grandTotal: Number(grandTotal.toFixed(2)),
        id: cart?.id,
        salesTaxAmount: Number(salesTaxAmount.toFixed(2)),
        qty: cart?.qty,
        vendorDeliveryFee,
        vendor: cart?.vendor,
        product: cart?.product,
        promocodeDiscountAmount,
        location: cart?.location,
        category: cart?.category,
        driverCancellationCharge,
        orderType: cart?.orderType,
        customerCancellationCharge,
        accessory: cart?.accessory,
        promocodes: cart?.promocode,
        promocodeDiscountPercentage,
        serviceFee: Number((serviceFee / cartData.length).toFixed(2)),
        serviceCharge: Number((serviceCharge / cartData.length).toFixed(2)),
        deliveryFees: Number((deliveryFees / cartData.length).toFixed(2)),
        freelanceDriverReceivedAmount,
        leakageFee: cart?.vendor?.vendor?.leakageFee || 0,
        scheduleDate: cart?.scheduleDate,
        cylinderSize: cart?.cylindersize,
        endTime: cart?.timeslot?.endTime,
        startTime: cart?.timeslot?.startTime,
        locationFee: cart?.location?.price || 0,
        salesTaxPercentage: cart?.zipcode?.salesTax || 0,
        cylindersize: cart?.cylindersize?.cylinderSize || 0,
        refundAmount: Number((grandTotal - customerCancellationCharge).toFixed(2)),
        indexPrice: (cart?.product?.details && cart?.product?.details[0]?.indexPrice) || 0,
        vendorReceivedAmount: Number(
          (((cart?.vendor?.vendor?.comissionFee || 0) * grandTotal) / 100).toFixed(2),
        ),
        adminReceivedAmount: Number(
          (((100 - (cart?.vendor?.vendor?.comissionFee || 0)) * grandTotal) / 100).toFixed(2),
        ),
        categoryType: cart?.accessory ? 3 : 0,
        zipcode: cart?.zipcode,
      };
    });
    return { cartDetails, serviceFee, serviceCharge, deliveryFees };
  }

  private async prepareOrderResponse(
    cartData: Cart[],
    count: number,
    checkForleakage: boolean,
  ): Promise<IOrderResponse> {
    const { cartDetails, serviceFee, serviceCharge, deliveryFees } = await this.getCartDetail(
      cartData,
      checkForleakage,
    );
    const leakageFee = cartDetails.map((fee) => Number(fee.vendor.vendor.leakageFee));
    const response: IOrderResponse = {
      count,
      serviceFee,
      orderDetails: cartDetails,
      serviceCharge,
      subTotal: sumBy(cartDetails, 'subTotal') + sumBy(cartDetails, 'vendorDeliveryFee'),
      grandTotal: sumBy(cartDetails, 'grandTotal'),
      leakageFee: _.sum(leakageFee),
      locationAmount: sumBy(cartDetails, 'locationFee'),
      deliveryFee: deliveryFees,
      salesTaxAmount: sumBy(cartDetails, 'salesTaxAmount'),
      promocodeDiscount: sumBy(cartDetails, 'promocodeDiscountAmount'),
    };
    return response;
  }

  private async prepareCartResponse(
    cartData: Cart[],
    count: number,
    checkForleakage: boolean,
  ): Promise<ICartResponse> {
    const { cartDetails, serviceFee, serviceCharge, deliveryFees } = await this.getCartDetail(
      cartData,
      checkForleakage,
    );
    const leakageFee = cartDetails.map((fee) => Number(fee.vendor.vendor.leakageFee));
    const response: ICartResponse = {
      count,
      serviceFee,
      cartDetails,
      serviceCharge,
      subTotal: sumBy(cartDetails, 'subTotal') + sumBy(cartDetails, 'vendorDeliveryFee'),
      grandTotal: sumBy(cartDetails, 'grandTotal'),
      leakageFee: _.sum(leakageFee),
      locationAmount: sumBy(cartDetails, 'locationFee'),
      deliveryFee: deliveryFees,
      salesTaxAmount: sumBy(cartDetails, 'salesTaxAmount'),
      promocodeDiscount: sumBy(cartDetails, 'promocodeDiscountAmount'),
    };
    return response;
  }

  private async checkVendorSchedule(
    timeslotId: number | string,
    vendorId: string,
    scheduleDate: Date | string,
  ) {
    const day = moment(scheduleDate).format('d');
    const schedule = await getManager()
      .getRepository(VendorSchedule)
      .findOne({ where: { timeSlot: timeslotId, vendor: vendorId, day, isChecked: true } });
    const start = moment(scheduleDate).startOf('day').toDate();
    const end = moment(scheduleDate).endOf('day').toDate();
    const orders = await getManager()
      .createQueryBuilder(OrderDetails, 'orderDetails')
      .where('orderDetails.vendor_id = :vendorId', { vendorId })
      .andWhere('orderDetails.schedule_date >= :start AND orderDetails.schedule_date <= :end', {
        start,
        end,
      })
      .innerJoin('orderDetails.order', 'order', 'order.time_slot_id = :timeslotId', {
        timeslotId,
      })
      .getCount();
    if (schedule && schedule?.maxAcceptOrderLimit > orders) return true;
    return false;
  }
}
export default GetCartService;
