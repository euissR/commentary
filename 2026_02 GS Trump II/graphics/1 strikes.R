source("0 data.R")
needs(lubridate, forcats, sf)

crs <- "+proj=robin"

# read ----------------------------------------------------------

strikes <- read_excel("data/US strikes 2017-25 (1).xlsx", sheet = "Data") %>%
  select(1:6) %>%
  rowid_to_column("id") %>%
  # add missing coordinates
  mutate(
    longitude = case_match(
      country,
      "Caribbean" ~ -69.41927521378376,
      "Caribbean – Venezuela" ~ -66.07943136165517,
      "Eastern Pacific - Colombia" ~ -78.8675177036382,
      "Eastern Pacific" ~ -91.42123679973946,
      .default = longitude
    ),
    latitude = case_match(
      country,
      "Caribbean" ~ 16.988568156961772,
      "Caribbean – Venezuela" ~ 11.237742142753032,
      "Eastern Pacific - Colombia" ~ 5.151196565906191,
      "Eastern Pacific" ~ 6.271260155591487,
      .default = latitude
    ),
    longitude = ifelse(
      country %in% c(
        "Caribbean",
        "Caribbean – Venezuela",
        "Eastern Pacific - Colombia",
        "Eastern Pacific",
        "Nigeria"
      ),
      jitter(longitude, factor = 33),
      longitude
    ),
    latitude = ifelse(
      country %in% c(
        "Caribbean",
        "Caribbean – Venezuela",
        "Eastern Pacific - Colombia",
        "Eastern Pacific",
        "Nigeria"
      ),
      jitter(latitude, factor = 33),
      latitude
    ),
    President = factor(President),
    President = fct_relevel(President, "Trump I", "Biden", "Trump II")
  ) %>%
  drop_na(latitude) %>%
  st_as_sf(coords = c("longitude", "latitude"), crs = 4326) %>%
  # simplify countries for labelling
  mutate(
    country = case_when(
      str_detect(country, "Caribb") ~ "Caribbean",
      str_detect(country, "Pacif") ~ "Eastern Pacific",
      .default = country
    )) %>% 
  print()

strikes_week <- strikes %>%
  mutate(
    week = floor_date(event_date, unit = "week"),
    week = date(week)
    # month_year = as_factor(format(month_year, "%Y-%m")),
    # month_year = fct_inorder(month_year)
  ) %>%
  print()

strikes_week_sum <- strikes_week %>%
  group_by(week, President) %>%
  summarise(n = n(), .groups = "drop") %>%
  print()

strikes_week_stack <- strikes_week %>%
  group_by(week, President) %>%
  mutate(stack = row_number()) %>%
  ungroup() %>%
  print()

# test
# strikes_week_stack %>% ggplot() + aes(week, stack) + geom_point(size = .5) + coord_fixed(ratio = 10)

strikes_week_stack %>%
  write_csv("web/strikes_week_stack.csv")

strikes_sf_pres <- strikes_sf %>%
  group_by(President, country) %>%
  mutate(n = n()) %>%
  distinct(President, country, .keep_all = TRUE) %>%
  print()

strikes_week_stack_sf <- strikes_week_stack %>%
  filter(President == "Trump II") %>%
  select(-c(event_date, year, President)) %>%
  st_as_sf() %>% 
  print()

strikes_week_stack_sf %>%
  st_write("web/strikes_week_stack_sf.geojson", delete_dsn = TRUE)

strikes_country <- strikes_week_stack_sf %>%
  st_drop_geometry() %>% 
  count(country) %>%
  left_join(
    strikes_week_stack_sf %>%
      st_centroid() %>% 
      euiss_sf_to_coords() %>% 
      group_by(country) %>% 
      summarize(lon = mean(lon), lat = mean(lat))
  ) %>%
  st_as_sf(coords = c("lon", "lat"), crs = 4326) %>%
  print()

strikes_country %>%
  st_write("web/strikes_country.geojson", delete_dsn = TRUE)

strikes_countries <- strikes_country %>% 
  st_drop_geometry() %>% 
  euiss_left_join(euiss_gisco() %>% 
                    select(ISO3_CODE),
                  country = "country") %>%
  drop_na(ISO3_CODE) %>%
  print()

strikes_countries %>%
  st_write("web/strikes_countries.geojson", delete_dsn = TRUE)

# bar monthly count -------------------------------------------------------

strikes_month %>%
  ggplot() +
  aes(week, n, fill = ifelse(str_detect(President, "Trump"), "Trump", "Biden")) +
  geom_col(width = 7) +
  # scale_x_discrete(
  #   breaks = c(
  #     "2017-01",
  #     "2018-01",
  #     "2019-01",
  #     "2020-01",
  #     "2021-01",
  #     "2022-01",
  #     "2023-01",
  #     "2024-01",
  #     "2025-01"
  #   )
  # ) +
  labs(
    title = "monthly strikes",
    subtitle = "",
    fill = NULL,
    caption = ""
  )
ggsave_euiss("img/7 strikes.jpg",
             publication = "brief",
             w = "full",
             h = .5)

# map ---------------------------------------------------------------------

strikes_sf %>%
  # tail()
  ggplot() +
  geom_sf(data = euiss_gisco(), fill = NA) +
  geom_sf_text(data = strikes_country, aes(label = country)) +
  geom_sf(aes(col = ifelse(
    str_detect(President, "Trump"), "Trump", "Biden"
  )), alpha = .33)
# facet_wrap(~ President, ncol = 1) +
coord_sf(
  crs = crs,
  xlim = c(-9500000, 7500000),
  ylim = c(-500000, 4000000),
  datum = NA
) +
  labs(title = "all strikes", col = NULL)
ggsave_euiss(
  "img/7 strikes_sf.jpg",
  publication = "brief",
  w = "full",
  h = .5
)

# map presidential aggregates ---------------------------------------------

strikes_sf_pres %>%
  # tail()
  ggplot() +
  geom_sf(data = euiss_gisco(), fill = NA) +
  geom_sf(aes(
    col = ifelse(str_detect(President, "Trump"), "Trump", "Biden"),
    size = n
  )) +
  geom_text_euiss(
    data = . %>%
      st_transform(crs) %>%
      euiss_sf_to_coords(),
    aes(lon + 100000, lat, label = country),
    vjust = 0,
    fontface = "bold"
  ) +
  geom_text_euiss(
    data = . %>%
      st_transform(crs) %>%
      euiss_sf_to_coords(),
    aes(lon + 100000, lat, label = n),
    vjust = 1
  ) +
  scale_size_area(max_size = 15) +
  facet_wrap( ~ President, ncol = 1) +
  coord_sf(
    crs = crs,
    xlim = c(-9500000, 7500000),
    ylim = c(-500000, 4000000),
    datum = NA
  ) +
  labs(title = "number strikes per country and presidency", col = NULL)
ggsave_euiss(
  "img/7 strikes_sf_pres.jpg",
  publication = "brief",
  w = "full",
  h = .5
)
