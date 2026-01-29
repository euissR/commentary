source("0 data.R")
needs(lubridate, forcats, sf)

crs <- "+proj=robin"

# read ----------------------------------------------------------

ieepa <- read_excel("data/Data_GS US scrolly 2026.xlsx",
                    sheet = "IEEPA (reciprocal) tariffs") %>%
  select(country = 1,
         cat = 2,
         rate = 3, 
         date = 4,
         deal = 5,
         ex = 6, 
         note = 7) %>%
  drop_na(cat) %>%  
  mutate(rate = ifelse(is.na(rate), 0, rate),
         cat = str_replace(cat, "\\+", "and "),
         cat = str_replace(cat, "  ", " ")) %>% 
  print()

ieepa_sf <- ieepa %>%
  euiss_left_join(euiss_gisco() %>% 
                    filter(!str_detect(NAME_ENGL, "Antar")) %>% 
                    select(NAME_ENGL, ISO3_CODE),
                  # verbose = TRUE,
                  country = "country") %>%
  print()

# replace EU geometry with entire EU
ieepa_sf$geometry[ieepa_sf$country == "European Union"] <-
  euiss_gisco() %>% 
  filter(!str_detect(NAME_ENGL, "Antar")) %>% 
  filter(EU_STAT == "T") %>% 
  st_union()

ieepa_sf %>% 
  st_transform(crs = "epsg:53035") %>%
  st_make_valid() %>%
  st_transform(crs = 4326) %>%
  mutate(NAME_ENGL = ifelse(is.na(NAME_ENGL), country, NAME_ENGL)) %>%
  select(country = NAME_ENGL, cat, rate, date, deal, ex, note) %>%
  st_write("web/ieepa_sf.geojson", delete_dsn = TRUE)

# map ---------------------------------------------------------------------

ieepa_sf %>% 
  ggplot() + 
  geom_sf(data = euiss_gisco(), 
          fill = NA) +
  # geom_sf(data = . %>% 
  #           st_centroid(),
  #         aes(size = rate),
  #         shape = 21,
  #         fill = fill_alpha("#000", .1)) +
  geom_sf(aes(fill = cat)) +
  scale_size_area(max_size = 7) +
  # scale_fill_gradientn(colors = c("#fff", rev(pal_seq_g_euiss(7)))) +
  coord_sf(crs = crs, datum = NA) +
  labs(title = "US tarrifs ", fill = NULL)
ggsave_euiss("img/3 ieepa_sf.jpg",
             publication = "brief",
             w = "full")

ieepa_sf %>% 
  ggplot() + 
  geom_sf(data = euiss_gisco(), 
          fill = NA) +
  geom_sf(aes(fill = rate)) +
  scale_size_area(max_size = 7) +
  scale_fill_gradientn(colors = c("#fff", rev(pal_seq_g_euiss(4)))) +
  coord_sf(crs = crs, datum = NA) +
  labs(title = "US tarrifs ", fill = NULL)
ggsave_euiss("img/3 ieepa_sf_rate.jpg",
             publication = "brief",
             w = "full")
