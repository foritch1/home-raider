const _ = require('lodash');

function parsePrice(str) {
  return parseInt(str.split(',').join(''), 10);
}

class RentInfo {
  constructor(rawData) {
    const r = rawData;

    // TODO: Will have different vendors in the future
    this.vendorId = 1;
    this.vendorName = '591';

    // Unique ID in 591
    //this.id = r.id;
    this.postId = r.post_id.toString(); // eg. 6077787
    //this.houseId = r.houseid;

    // Unique ID in Home Raider
    this.id = this.vendorId + '-' + this.postId;

    // Cover Image
    this.coverImage = r.cover;
    //this.coverImg = r.filename;

    this.numOfImages = r.photoNum;
    this.hasImage = r.hasImg === 1; // ...?

    // Post Title
    //this.title = r.address_img;
    this.title = r.address_img_title;
    
    // Other Post Tags
    this.isVip = r.isvip === 1;

    // Basic House Info
    this.kindId = r.kind;
    this.kindName = r.kind_name; // eg. 整層住家
    //this.kindName = r.kind_name_img;
    this.layoutName = r.layout; // eg. 2房1廳1衛
    this.numOfRooms = r.room;
    this.areaInPing = r.area; // uses 坪
    this.floorNum = r.floor;
    this.totalFloors = r.allfloor;
    this.floorText = r.floorInfo; // eg. 樓層：4/12

    // Price
    this.price = parsePrice(r.price);
    this.priceUnit = r.unit; // eg. 元/月

    // Address
    this.regionId = r.regionid;
    this.regionName = r.regionname; // eg. 台北市
    //this.regionName = r.region_name;
    
    this.sectionId = r.sectionid;
    this.sectionName = r.sectionname;
    this.sectionName = r.section_name; // eg. 內湖區

    this.streetId = r.streetid;
    this.streetName = r.street_name; // eg. 康寧路三段

    this.alleyName = r.alley_name; // eg. 190巷
    this.laneName = r.lane_name;
    this.addressNumber = r.addr_number_name; // eg. 35號

    // Community
    this.communityId = r.cases_id;
    this.communityName = r.cases_name; // eg. 長耀GLORY

    // Contact / Broker / Owner
    //this.contactType = r.nick_name.split(' ')[0]; // eg. 仲介
    this.contactName = r.nick_name; // eg. 仲介 林小姐
    //this.contactName = r.linkman; // eg. 林小姐
    this.contactId = r.user_id; // eg. 448470

    // Other Post Info
    this.updateTime = r.updatetime; // eg. 1519180011
    this.refreshTime = r.refreshtime; // eg. 1519180011
    this.numOfComments = r.comment_total;
    this.numOfImpressions = r.browsenum; // data from the day before...?
    this.totalNumOfImpressions = r.browsenum_all; // ...

    // House Conditions
    this.houseConditions = r.condition.split(',');
    // convert to hasXXX?

    // ...
  }

  toJSON() {
    const properties = Object.getOwnPropertyNames(this);

    return properties.reduce((result, propName) => {
      result[_.snakeCase(propName)] = this[propName];
      return result;
    }, {});
  }
}

module.exports = {
  RentInfo,
};
