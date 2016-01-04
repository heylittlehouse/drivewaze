class User < ActiveRecord::Base
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :trackable, :validatable, :omniauthable

  has_many :bookings, dependent: :destroy
  has_many :listings, dependent: :destroy
  has_many :reviews, as: :reviewable, dependent: :destroy
  has_many :favorites, dependent: :destroy
  has_many :favorite_listings, through: :favorites, source: :favorited, source_type: "Listing", dependent: :destroy
  has_many :favorite_users, through: :favorites, source: :favorited, source_type: "User", dependent: :destroy
  has_attached_file :avatar, styles: { medium: "300x300>", thumb: "100x100>" }, default_url: "missing-user.png"

  validates_attachment_content_type :avatar, content_type: /\Aimage\/.*\Z/


  def average_rating
    if self.reviews.length > 0
      ratings = self.reviews
      sum = 0
      ratings.each do |rating|
        sum += rating.review_score
      end
      return sum / ratings.length
    else
      return 0
    end
  end
end
