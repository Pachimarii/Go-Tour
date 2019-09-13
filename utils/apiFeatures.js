class APIFeatures {
  constructor(query, queryString){
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    // Build Query:
    //1) Filtering
    //... take all the fields out of object,use {} to create new object
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    //use delete operator, removes object property
    excludedFields.forEach(el => delete queryObj[el]);

    //2) Advanced filtering:
    let queryStr = JSON.stringify(queryObj);

    //replace gte,gt,lte,lt, g flag: appear multiple times
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

    // return all document in the collections
    //it will return a promise, so we need to use await and async
    //If no queryobj provided, we will look up all the document
    this.query = this.query.find(JSON.parse(queryStr));
    //  let query = Tour.find(JSON.parse(queryStr));
    return this;
  }

  sort() {
    //3) sorting 127.0.0.1:8000/api/v1/tours?sort=price,ratingAverage
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      //sortBYy :price ratingsAverage  sort price then if we have a tie , we sort by rating
      this.query = this.query.sort(sortBy);
    } else {
      //default
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  limitFields() {
    //4) Field limiting:
    // 127.0.0.1:8000/api/v1/tours?fields=name,duration,difficulty,price
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      // fields : name duration difficulty price
      this.query = this.query.select(fields);
    } else {
      //- represent excluded
      this.query = this.query.select('-__v');
    }
    return this;
  }

  paginate() {
    // 5)Page pagination, we might dont need this section
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;
    //127.0.0.1:8000/api/v1/tours?page=2&limit=10
    //user want page number 2 of 10 document on each page. Page 1: 1-10 Page 2 11-20
    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}

module.exports = APIFeatures;
